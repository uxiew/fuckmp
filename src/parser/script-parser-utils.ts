/**
 * Script parser AST 信息构造工具。
 */

import type { CallExpression, FunctionDeclaration, ImportDeclaration, VariableDeclarator } from '@babel/types'
import { VUE3_MACROS } from '@/types/index.js'
import { isCallExpression, isIdentifier } from '@/utils/index.js'
import { extractArgumentValue, generateCodeString } from './script-codegen-utils.js'
import { readStaticScriptValue } from './script-static-value.js'
import {
  extractDefineModelInfo,
  extractDefinePropsDestructureInfo,
  extractUseTemplateRefInfo,
  extractWithDefaultsInfo,
  getArrayPatternFirstIdentifier
} from './script-macro-utils.js'
import type {
  ExportInfo,
  FunctionInfo,
  ImportInfo,
  MacroCall,
  ScriptParseResult,
  VariableInfo
} from './script-parser.js'

export type VariableDeclarationKind = 'const' | 'let' | 'var'
export type ScriptParserContext = Pick<ScriptParseResult, 'variables'>

/** 根据 import declaration 构造 parser 的导入信息。 */
export function createImportInfo(node: ImportDeclaration): ImportInfo {
  const source = node.source.value
  const importInfo: ImportInfo = {
    source,
    specifiers: [],
    isVue: source === 'vue',
    isComponent: source.endsWith('.vue'),
    isStyle: source.endsWith('.scss') || source.endsWith('.sass') || source.endsWith('.css')
  }

  node.specifiers.forEach(spec => {
    if (spec.type === 'ImportDefaultSpecifier') {
      importInfo.specifiers.push({
        type: 'default',
        local: spec.local.name
      })
    } else if (spec.type === 'ImportSpecifier') {
      importInfo.specifiers.push({
        type: 'named',
        imported: isIdentifier(spec.imported) ? spec.imported.name : spec.imported.value,
        local: spec.local.name
      })
    } else if (spec.type === 'ImportNamespaceSpecifier') {
      importInfo.specifiers.push({
        type: 'namespace',
        local: spec.local.name
      })
    }
  })

  return importInfo
}

/** 根据 call expression 构造 Vue 编译宏调用信息。 */
export function createVueMacroCall(
  node: CallExpression,
  variables: ScriptParserContext['variables'],
  calleeName = isIdentifier(node.callee) ? node.callee.name : null
): MacroCall | undefined {
  if (!calleeName || !Object.values(VUE3_MACROS).includes(calleeName as any)) {
    return undefined
  }

  return {
    name: calleeName,
    arguments: node.arguments.map(arg => extractArgumentValue(arg, variables)),
    location: node.loc ? `${node.loc.start.line}:${node.loc.start.column}` : 'unknown',
    typeParameters: node.typeParameters,
    ...(calleeName === 'defineProps' && node.arguments[0] && { runtimeArgument: node.arguments[0] })
  }
}

/** 根据 variable declarator 构造 parser 的变量信息。 */
export function createVariableInfoFromDeclarator(
  declarator: VariableDeclarator,
  kind: VariableDeclarationKind,
  result: ScriptParserContext,
  calleeName = declarator.init && isCallExpression(declarator.init) && isIdentifier(declarator.init.callee)
    ? declarator.init.callee.name
    : null
): VariableInfo | undefined {
  if (declarator.id.type === 'ObjectPattern' &&
    declarator.init &&
    isCallExpression(declarator.init) &&
    calleeName === 'defineProps') {
    const name = `__definePropsDestructure_${result.variables.size}`
    return {
      name,
      type: kind,
      init: extractDefinePropsDestructureInfo(declarator.id, result),
      isReactive: false,
      macroType: 'definePropsDestructure'
    }
  }

  if (declarator.id.type === 'ArrayPattern' &&
    declarator.init &&
    isCallExpression(declarator.init) &&
    calleeName === 'defineModel') {
    const modelVariableName = getArrayPatternFirstIdentifier(declarator.id)
    if (!modelVariableName) {
      return undefined
    }

    return {
      name: modelVariableName,
      type: kind,
      init: extractDefineModelInfo(declarator.init, modelVariableName, result),
      isReactive: false,
      macroType: 'defineModel'
    }
  }

  if (declarator.id.type !== 'Identifier') {
    return undefined
  }

  const name = declarator.id.name
  const macroInit = createMacroVariableInit(declarator.init, name, result, calleeName)
  const initializer = declarator.init
  const staticInitializer = initializer && isCallExpression(initializer)
    ? calleeName === 'ref' || calleeName === 'reactive' ? readStaticScriptValue(initializer.arguments[0]) : undefined
    : readStaticScriptValue(initializer)
  return {
    name,
    type: kind,
    init: macroInit.initValue,
    ...(typeof staticInitializer === 'string' && { literalStringInitializer: staticInitializer }),
    isReactive: macroInit.isReactive,
    ...(macroInit.macroType && { macroType: macroInit.macroType })
  }
}

/** 根据函数声明构造 parser 的函数信息。 */
export function createFunctionInfo(node: FunctionDeclaration, variables?: ScriptParserContext['variables']): FunctionInfo | undefined {
  if (!node.id || !isIdentifier(node.id)) {
    return undefined
  }

  return {
    name: node.id.name,
    params: node.params.map(param => isIdentifier(param) ? param.name : 'unknown'),
    isAsync: node.async,
    isArrow: false,
    ...(!node.async && !node.generator && { body: generateCodeString(node, variables) })
  }
}

/** 根据 export declaration 构造 parser 的导出信息。 */
export function createExportInfo(
  node: any,
  result: ScriptParserContext,
  type: 'default' | 'named'
): ExportInfo {
  return {
    type,
    name: type === 'named' && node.declaration?.id?.name ? node.declaration.id.name : undefined,
    value: node.declaration ? extractArgumentValue(node.declaration, result.variables) : undefined
  }
}

function createMacroVariableInit(
  init: VariableDeclarator['init'],
  name: string,
  result: ScriptParserContext,
  calleeName: string | null
): { initValue: any, isReactive: boolean, macroType?: string } {
  if (!init) {
    return { initValue: undefined, isReactive: false }
  }

  if (!isCallExpression(init)) {
    return { initValue: extractArgumentValue(init, result.variables), isReactive: false }
  }

  if (calleeName === 'ref' || calleeName === 'reactive' || calleeName === 'computed') {
    return {
      initValue: init.arguments.length > 0 ? extractArgumentValue(init.arguments[0], result.variables) : undefined,
      isReactive: true,
      macroType: calleeName
    }
  }

  if (calleeName === 'defineModel') {
    return {
      initValue: extractDefineModelInfo(init, name, result),
      isReactive: false,
      macroType: calleeName
    }
  }

  if (calleeName === 'defineProps' || calleeName === 'defineEmits' || calleeName === 'defineSlots' || calleeName === 'useId') {
    return {
      initValue: { variable: name },
      isReactive: false,
      macroType: calleeName
    }
  }

  if (calleeName === 'withDefaults') {
    return {
      initValue: extractWithDefaultsInfo(init, result),
      isReactive: false,
      macroType: calleeName
    }
  }

  if (calleeName === 'useTemplateRef') {
    return {
      initValue: extractUseTemplateRefInfo(init, name, result),
      isReactive: false,
      macroType: calleeName
    }
  }

  if (calleeName === 'inject') {
    return {
      initValue: {
        variable: name,
        key: init.arguments[0] ? extractArgumentValue(init.arguments[0], result.variables) : ''
      },
      isReactive: false,
      macroType: calleeName
    }
  }

  return {
    initValue: extractArgumentValue(init, result.variables),
    isReactive: false
  }
}
