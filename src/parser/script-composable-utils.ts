import type { NodePath } from '@babel/traverse'
import * as t from '@babel/types'
import { traverseAST } from '@/utils/index.js'
import { getVueCallName } from './script-binding-utils.js'
import { getStaticPropertyKey, readStaticScriptValue } from './script-static-value.js'

type ComposableFunction = NodePath<t.FunctionDeclaration>
type ComposableKind = 'ref' | 'computed' | 'method'

export function lowerLocalComposables(ast: t.File, filename: string): void {
  traverseAST(ast, {
    Program(program) {
      const lowered = new Map<ComposableFunction, Set<t.Node>>()
      for (const statement of program.get('body')) {
        if (!statement.isVariableDeclaration()) continue
        const declarations: t.VariableDeclaration[] = []
        for (const { node } of statement.get('declarations')) {
          const { id, init } = node
          if (!t.isCallExpression(init) || !t.isIdentifier(init.callee) || !/^use[A-Z]/.test(init.callee.name)) {
            declarations.push(t.variableDeclaration(statement.node.kind, [node]))
            continue
          }

          const binding = program.scope.getBinding(init.callee.name)
          const fn = binding?.path
          if (!fn?.isFunctionDeclaration() || !fn.parentPath?.isProgram()) {
            if (t.isObjectPattern(id) && fn && getVueCallName(init, program.scope) === null) {
              throw composableError(filename, init, '只支持同一 SFC 中的顶层函数声明，不支持导入或动态实现')
            }
            declarations.push(t.variableDeclaration(statement.node.kind, [node]))
            continue
          }

          if (!t.isObjectPattern(id) || statement.node.kind !== 'const') {
            throw composableError(filename, init, '必须用 const 对返回对象进行静态解构')
          }

          declarations.push(...expandComposable(fn, id, init, program, filename))
          const calls = lowered.get(fn) ?? new Set<t.Node>()
          calls.add(init.callee)
          lowered.set(fn, calls)
        }
        if (declarations.some(decl => !statement.node.declarations.includes(decl.declarations[0]!))) {
          statement.replaceWithMultiple(declarations)
        }
      }

      for (const [fn, calls] of lowered) {
        const binding = program.scope.getBinding(fn.node.id!.name)
        if (binding?.referencePaths.some(path => !calls.has(path.node))) {
          throw composableError(filename, fn.node, '函数只可在顶层静态调用，不可作为值传递或在运行时调用')
        }
        fn.remove()
      }
      if (lowered.size) program.scope.crawl()
      program.skip()
    }
  })
}

function expandComposable(fn: ComposableFunction, pattern: t.ObjectPattern, call: t.CallExpression,
  program: NodePath<t.Program>, filename: string): t.VariableDeclaration[] {
  const fail = (reason: string): never => { throw composableError(filename, call, reason) }
  const { params, body, generator, async } = fn.node
  if (generator || async || params.length !== call.arguments.length ||
    !params.every(param => t.isIdentifier(param)) ||
    !call.arguments.every(arg => {
      const value = readStaticScriptValue(arg)
      return value !== undefined && (value === null || typeof value !== 'object')
    })) {
    return fail('参数必须是简单标识符，调用时必须传入对应的静态标量')
  }

  const returnStatement = body.body.at(-1)
  if (!t.isReturnStatement(returnStatement) || !t.isObjectExpression(returnStatement.argument)) {
    return fail('必须以返回静态对象的 return 语句结束')
  }

  const locals = new Map<string, ComposableKind>()
  for (const statement of body.body.slice(0, -1)) {
    if (!t.isVariableDeclaration(statement, { kind: 'const' })) return fail('函数体只允许 const 声明和最终 return')
    for (const { id, init } of statement.declarations) {
      if (!t.isIdentifier(id) || !init) return fail('局部声明必须是简单标识符')
      const kind = t.isCallExpression(init) ? getVueCallName(init, fn.scope) : null
      if (kind === 'ref' || kind === 'computed') {
        if (init.type !== 'CallExpression' || init.arguments.length !== 1 ||
          (kind === 'computed' && !t.isArrowFunctionExpression(init.arguments[0]))) {
          return fail('响应式调用只接受一个初始值或无参 getter')
        }
        locals.set(id.name, kind)
      } else if (t.isArrowFunctionExpression(init) && !init.async && init.params.length === 0) {
        locals.set(id.name, 'method')
      } else {
        return fail('局部值只支持 ref、computed 或同步无参箭头函数')
      }
    }
  }

  const returned = new Map<string, string>()
  for (const prop of returnStatement.argument.properties) {
    if (!t.isObjectProperty(prop) || !t.isIdentifier(prop.value) || !locals.has(prop.value.name)) {
      return fail('返回对象的每个值必须是已声明的局部绑定')
    }
    const key = getStaticPropertyKey(prop)
    if (key === undefined || returned.has(key)) return fail('返回对象的键必须为唯一的静态名称')
    returned.set(key, prop.value.name)
  }

  const outputs = new Map<string, string>()
  for (const prop of pattern.properties) {
    if (!t.isObjectProperty(prop) || !t.isIdentifier(prop.value)) return fail('解构不支持嵌套、默认值或 rest')
    const key = getStaticPropertyKey(prop)
    const source = key === undefined ? undefined : returned.get(key)
    if (source === undefined || outputs.has(source)) return fail('解构必须指向不同的已返回绑定')
    outputs.set(source, prop.value.name)
  }

  const isolated = t.file(t.program([t.cloneNode(fn.node, true)]))
  let result: t.VariableDeclaration[] = []
  traverseAST(isolated, {
    FunctionDeclaration(copy) {
      const lastStatement = copy.get('body').get('body').at(-1)!
      const vueCallees = new Set<t.Node>()
      const initializers = new Map<string, t.Expression>()
      for (const statement of copy.node.body.body.slice(0, -1) as t.VariableDeclaration[]) {
        for (const { id, init } of statement.declarations) {
          initializers.set((id as t.Identifier).name, init!)
          if (t.isCallExpression(init)) vueCallees.add(init.callee)
        }
      }
      lastStatement.remove()

      const ids = new Map<string, t.Identifier>()
      for (const name of locals.keys()) {
        const label = outputs.get(name)
        ids.set(name, label ? t.identifier(label) : program.scope.generateUidIdentifier(name))
        const local = copy.scope.getBinding(name)!
        if (local.constantViolations.length) {
          return fail('不支持重绑局部值')
        }
      }

      const argumentValues = new Map(params.map((param, index) => [
        param.name, t.valueToNode(readStaticScriptValue(call.arguments[index]))
      ]))
      if (params.some(param => !copy.scope.getBinding(param.name)?.constant)) {
        return fail('不支持修改 composable 参数')
      }
      copy.traverse({
        ReferencedIdentifier(path) {
          const { name } = path.node
          const binding = path.scope.getBinding(name)
          if (!binding) {
            if (!vueCallees.has(path.node) && !['Math', 'Number', 'String', 'Boolean'].includes(name)) {
              fail(`不能捕获外部绑定：${name}`)
            }
            return
          }
          if (binding.scope !== copy.scope) return
          const arg = argumentValues.get(name)
          if (arg) {
            path.replaceWith(t.cloneNode(arg, true))
            return
          }
          const id = ids.get(name)
          const parent = path.parentPath
          if (id && locals.get(name) === 'ref' && parent.isMemberExpression() && parent.node.object === path.node &&
            !parent.node.computed && t.isIdentifier(parent.node.property, { name: 'value' })) {
            path.replaceWith(t.memberExpression(t.thisExpression(), t.cloneNode(id)))
          } else {
            fail(`只支持通过 .value 访问 composable 的局部 ref：${name}`)
          }
        }
      })

      for (const statement of copy.node.body.body as t.VariableDeclaration[]) {
        for (const declaration of statement.declarations) {
          const name = (declaration.id as t.Identifier).name
          const init = initializers.get(name)
          const kind = locals.get(name)
          if (kind === 'ref') {
            const value = t.isCallExpression(init) ? readStaticScriptValue(init.arguments[0]) : undefined
            if (value !== null && typeof value !== 'number' && typeof value !== 'boolean') {
              fail('composable 的 ref 初始值必须是静态数字、布尔值或 null')
            }
            declaration.init = t.callExpression(t.cloneNode((init as t.CallExpression).callee), [t.valueToNode(value)])
          } else if (kind === 'computed' && t.isCallExpression(init) &&
            t.isArrowFunctionExpression(init.arguments[0]) && init.arguments[0].params.length !== 0) {
            fail('computed getter 必须是无参箭头函数')
          }
          declaration.id = ids.get(name)!
        }
      }
      result = copy.node.body.body as t.VariableDeclaration[]
      copy.skip()
    }
  })

  return result
}

function composableError(filename: string, node: t.Node, reason: string): Error {
  return new Error(`${filename}:${node.loc?.start.line ?? '?'}: 无法静态编译 composable：${reason}`)
}
