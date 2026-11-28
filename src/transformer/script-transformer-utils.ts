/**
 * ScriptTransformer 内部工具函数。
 */

import type { TransformContext } from '@/types/index.js'
import type { ScriptParseResult } from '@/parser/index.js'
import { logger } from '@/utils/index.js'
import { normalizeComputedGetter } from './computed-getter-utils.js'
import { applyPropAccessMappingsToScript } from './prop-access-mapping.js'
import { inferConstructorFromValue } from './script-value-utils.js'

/**
 * Script import 解析结果所需的最小字段。
 */
export interface ScriptImportInfoLike {
  /** import specifier 列表。 */
  specifiers: Array<{
    type: 'default' | 'named' | 'namespace'
    imported?: string
    local: string
  }>
  /** 是否来自 Vue。 */
  isVue: boolean
  /** 是否是组件导入。 */
  isComponent: boolean
  /** 是否是样式导入。 */
  isStyle: boolean
}

/**
 * 创建脚本转换的初始上下文。
 */
export function createScriptTransformContext(filename: string, isPage: boolean): TransformContext {
  return {
    filename,
    isPage,
    hasScoped: false,
    props: {},
    emits: [],
    expose: {},
    defineOptions: {},
    defineSlots: {},
    watcherEffects: {},
    templateRefs: {},
    useIds: {},
    provideInject: {},
    templateUnsupported: {},
    data: {},
    methods: {},
    computed: {},
    watch: {},
    lifecycle: {},
    imports: new Set(),
    components: new Map(),
    reactiveVariables: new Map(),
    propAliases: new Map(),
    propNamespaces: new Set()
  }
}

/**
 * 将脚本 import 信息记录到转换上下文。
 */
export function recordScriptImports(
  imports: Map<string, ScriptImportInfoLike> | undefined,
  context: TransformContext
): void {
  if (!imports) {
    return
  }

  imports.forEach((importInfo, source) => {
    if (importInfo.isVue) {
      importInfo.specifiers.forEach(spec => {
        context.imports.add(spec.local)
      })
    } else if (importInfo.isComponent) {
      importInfo.specifiers.forEach(spec => {
        if (spec.type === 'default') {
          context.components.set(spec.local, source)
        }
      })
    } else if (importInfo.isStyle) {
      if (!context.styleImports) {
        context.styleImports = []
      }
      context.styleImports.push(source)
      logger.debug(`发现样式导入: ${source}`)
    }
  })
}

/**
 * 判断变量初始值是否是函数表达式源码。
 */
export function isFunctionInitializer(initValue: unknown): initValue is string {
  return typeof initValue === 'string' &&
    (initValue.includes('=>') ||
      initValue.includes('function') ||
      initValue.startsWith('(') && initValue.includes(') =>'))
}

/**
 * 从函数表达式初始化值构造 setup 方法记录。
 */
export function createMethodFromFunctionInitializer(name: string, initValue: string): Record<string, any> {
  return {
    name,
    params: [],
    isAsync: false,
    isArrow: initValue.includes('=>'),
    body: initValue
  }
}

/**
 * 转换 computed 属性 getter 中的响应式变量与 props 访问。
 */
export function transformComputedGetter(
  getter: string,
  parseResult: Pick<ScriptParseResult, 'variables' | 'nativeMacroReferencesLowered'>,
  context: TransformContext
): string {
  if (!getter || typeof getter !== 'string') {
    return 'return null'
  }

  let transformedGetter = normalizeComputedGetter(getter)

  const reactiveVars = new Set<string>()
  parseResult.variables.forEach((variable, name) => {
    if (variable.isReactive && variable.macroType !== 'computed') {
      reactiveVars.add(name)
    }
  })

  reactiveVars.forEach(varName => {
    const thisAccessRegex = new RegExp(`\\bthis\\.${varName}\\.value\\b`, 'g')
    transformedGetter = transformedGetter.replace(thisAccessRegex, `this.data.${varName}`)

    const bareAccessRegex = new RegExp(`(?<![\\w$.])${varName}\\.value\\b`, 'g')
    transformedGetter = transformedGetter.replace(bareAccessRegex, `this.data.${varName}`)
  })

  return parseResult.nativeMacroReferencesLowered
    ? transformedGetter
    : applyPropAccessMappingsToScript(transformedGetter, context)
}

/**
 * 将 prop 默认值合并到 defineProps 生成的 properties。
 */
export function mergePropDefaults(defaults: Record<string, any>, context: TransformContext): void {
  Object.entries(defaults).forEach(([propName, defaultValue]) => {
    const existingProp = context.props[propName]
    if (existingProp && typeof existingProp === 'object') {
      context.props[propName] = {
        ...existingProp,
        default: defaultValue
      }
      return
    }

    context.props[propName] = {
      type: typeof existingProp === 'function' ? existingProp : inferConstructorFromValue(defaultValue),
      default: defaultValue,
      required: false
    }
  })
}

/**
 * 将类型名称映射为小程序 property 构造函数。
 */
export function getConstructorFromTypeName(typeName: string | undefined): any {
  switch (typeName) {
    case 'Number':
      return Number
    case 'Boolean':
      return Boolean
    case 'Array':
      return Array
    case 'Object':
      return Object
    case 'String':
    default:
      return String
  }
}

/**
 * 将 defineModel 变量信息写入原生小程序 property 与 update 事件。
 */
export function applyDefineModelVariable(variable: any, context: TransformContext): void {
  const modelInfo = variable.init || {}
  const propName = modelInfo.property || 'modelValue'
  const propType = getConstructorFromTypeName(modelInfo.type)

  context.props[propName] = {
    type: propType,
    default: modelInfo.default,
    required: Boolean(modelInfo.required)
  }

  const updateEvent = `update:${propName}`
  if (!context.emits.includes(updateEvent)) {
    context.emits.push(updateEvent)
  }
}

/**
 * 将响应式 props 解构的默认值与局部别名合并到转换上下文。
 */
export function applyDefinePropsDestructureVariable(variable: any, context: TransformContext): void {
  const defaults = variable.init?.defaults || {}
  const aliases = variable.init?.aliases || {}

  mergePropDefaults(defaults, context)

  if (!context.propAliases) {
    context.propAliases = new Map()
  }
  Object.entries(aliases).forEach(([localName, propName]) => {
    context.propAliases!.set(localName, String(propName))
  })
}

/**
 * 追加生命周期代码，避免覆盖用户已有生命周期转换结果。
 */
export function appendLifecycleCode(
  context: TransformContext,
  lifecycleName: string,
  code: string
): void {
  const existingCode = context.lifecycle[lifecycleName]
  context.lifecycle[lifecycleName] = existingCode && existingCode.trim()
    ? `${existingCode.trim()}\n${code}`
    : code
}
