import type { Binding, NodePath } from '@babel/traverse'
import * as t from '@babel/types'
import { traverseAST } from '@/utils/index.js'
import { getVueCallName, isSetupDeclaration } from './script-binding-utils.js'
import { getStaticPropertyKey, readStaticScriptValue } from './script-static-value.js'

export function lowerMacroReferences(ast: t.File, filename: string): void {
  const emitBindings = new Set<Binding>()
  const modelBindings = new Map<Binding, string>()
  const propBindings = new Map<Binding, { property?: string }>()
  const methodBindings = new Set<Binding>()
  const reactiveBindings = new Set<Binding>()
  const staticBindings = new Set<Binding>()

  traverseAST(ast, {
    FunctionDeclaration(path) {
      if (!isSetupDeclaration(path) || !path.node.id || path.node.async || path.node.generator) return
      const binding = path.parentPath.scope.getBinding(path.node.id.name)
      if (binding) methodBindings.add(binding)
    },
    VariableDeclarator(path) {
      const { id, init } = path.node
      if (!isSetupDeclaration(path.parentPath)) return
      if (t.isIdentifier(id) && (t.isArrowFunctionExpression(init) || t.isFunctionExpression(init))) {
        const binding = path.scope.getBinding(id.name)
        if (binding?.constant) methodBindings.add(binding)
      }
      if (t.isIdentifier(id)) {
        const binding = path.scope.getBinding(id.name)
        if (binding?.kind === 'const' && binding.constant && readStaticScriptValue(init) !== undefined) {
          staticBindings.add(binding)
        }
      }
      if (!t.isCallExpression(init)) return

      const macro = getVueCallName(init, path.scope)
      if (macro === 'defineProps' || macro === 'withDefaults') {
        if (t.isIdentifier(id)) {
          const binding = path.scope.getBinding(id.name)
          if (binding) propBindings.set(binding, {})
        } else if (macro === 'defineProps' && t.isObjectPattern(id)) {
          for (const prop of id.properties) {
            if (!t.isObjectProperty(prop)) continue
            const property = getStaticPropertyKey(prop)
            const target = t.isAssignmentPattern(prop.value) ? prop.value.left : prop.value
            const binding = t.isIdentifier(target) ? path.scope.getBinding(target.name) : undefined
            if (binding && property !== undefined) propBindings.set(binding, { property })
          }
        }
      }

      const local = t.isArrayPattern(id) ? id.elements[0] : id
      if (!t.isIdentifier(local)) return
      const binding = path.scope.getBinding(local.name)
      if (!binding) return

      if (t.isIdentifier(id) && (macro === 'reactive' || macro === 'computed')) reactiveBindings.add(binding)
      if (macro === 'defineEmits' && t.isIdentifier(id)) emitBindings.add(binding)
      if (macro === 'defineModel') {
        const name = init.arguments[0]
        modelBindings.set(binding, t.isStringLiteral(name) ? name.value : 'modelValue')
      }
    }
  })

  traverseAST(ast, {
    ReferencedIdentifier(path) {
      if (path.findParent(parent => parent.isTSType())) return
      const binding = path.scope.getBinding(path.node.name)
      const prop = binding ? propBindings.get(binding) : undefined
      if (prop) {
        path.replaceWith(prop.property === undefined
          ? t.memberExpression(t.thisExpression(), t.identifier('properties'))
          : modelData(prop.property))
      } else if (binding && path.getFunctionParent()) {
        if (reactiveBindings.has(binding)) {
          path.replaceWith(t.memberExpression(t.thisExpression(), t.identifier(path.node.name)))
        } else if (staticBindings.has(binding)) {
          path.replaceWith(modelData(path.node.name))
        }
      }
    },
    CallExpression(path) {
      const callee = path.node.callee
      if (!t.isIdentifier(callee)) return

      const binding = path.scope.getBinding(callee.name)
      if (binding && emitBindings.has(binding)) {
        path.node.callee = t.memberExpression(t.thisExpression(), t.identifier('triggerEvent'))
      } else if (binding && methodBindings.has(binding) && path.getFunctionParent()) {
        path.node.callee = t.memberExpression(t.thisExpression(), t.identifier(callee.name))
      }
    },
    MemberExpression(path) {
      const { object, property, computed } = path.node
      if (!t.isIdentifier(object) ||
        !(computed ? t.isStringLiteral(property, { value: 'value' }) : t.isIdentifier(property, { name: 'value' }))) {
        return
      }

      const binding = path.scope.getBinding(object.name)
      const name = binding ? modelBindings.get(binding) : undefined
      if (name === undefined) return

      const parent = path.parentPath
      if (parent.isAssignmentExpression() && parent.node.left === path.node) {
        const { operator, right } = parent.node
        const update = operator === '=' ? right : modelBinaryValue(operator, name, right)
        lowerModelWrite(parent, name, update, filename)
      } else if (parent.isUpdateExpression()) {
        const op = parent.node.operator === '++' ? '+' : '-'
        lowerModelWrite(parent, name, t.binaryExpression(op, t.unaryExpression('+', modelData(name)), t.numericLiteral(1)), filename)
      } else {
        path.replaceWith(modelData(name))
      }
    }
  })
}

function modelData(name: string): t.MemberExpression {
  const data = t.memberExpression(t.thisExpression(), t.identifier('data'))
  return t.isValidIdentifier(name) ? t.memberExpression(data, t.identifier(name)) :
    t.memberExpression(data, t.stringLiteral(name), true)
}

function modelBinaryValue(operator: t.AssignmentExpression['operator'], name: string, right: t.Expression) {
  if (operator === '&&=' || operator === '||=' || operator === '??=') return undefined
  return t.binaryExpression(operator.slice(0, -1) as t.BinaryExpression['operator'], modelData(name), right)
}

function lowerModelWrite(path: NodePath<t.AssignmentExpression | t.UpdateExpression>, name: string,
  value: t.Expression | undefined, filename: string): void {
  const expression = path.parentPath.isExpressionStatement() ? path.parentPath : undefined
  if (!expression || !path.getFunctionParent() || !value) {
    throw new Error(`${filename}:${path.node.loc?.start.line ?? '?'}: defineModel 只支持函数体中的独立 .value 赋值或自增/自减语句`)
  }

  const local = path.scope.generateUidIdentifier('modelValue')
  const invoke = (method: string, args: t.Expression[]) => t.expressionStatement(
    t.callExpression(t.memberExpression(t.thisExpression(), t.identifier(method)), args)
  )
  expression.replaceWith(t.blockStatement([
    t.variableDeclaration('const', [t.variableDeclarator(local, value)]),
    invoke('setData', [t.objectExpression([t.objectProperty(t.stringLiteral(name), t.cloneNode(local))])]),
    invoke('_updateComputed', []),
    invoke('triggerEvent', [t.stringLiteral(`update:${name}`), t.cloneNode(local)])
  ]))
}
