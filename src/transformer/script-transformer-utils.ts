/**
 * ScriptTransformer 内部工具函数。
 */

import type { TransformContext } from '@/types/index.js'
import { inferConstructorFromValue } from './script-value-utils.js'

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
      type: inferConstructorFromValue(defaultValue),
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
