/**
 * 组件 methods 代码生成工具。
 */

import type { TransformContext } from '@/types/index.js'
import type { TemplateTransformResult } from '@/transformer/index.js'

/**
 * 组件 methods 生成参数。
 */
export interface ComponentMethodsGenerationOptions {
  /** 用户脚本中声明的方法。 */
  methods: Record<string, any>
  /** computed 声明。 */
  computed: Record<string, any>
  /** defineEmits / defineModel 派生事件名。 */
  emits: string[]
  /** 当前转换上下文。 */
  context: TransformContext
  /** 模板转换结果。 */
  templateResult: TemplateTransformResult
}

/**
 * 组合生成组件 methods 块内容。
 */
export function generateComponentMethods(options: ComponentMethodsGenerationOptions): string {
  const methodParts: string[] = []

  const userMethods = generateUserMethods(options.methods)
  if (userMethods.trim()) {
    methodParts.push(userMethods)
  }

  const computedMethods = generateComputedMethods(options.computed)
  if (computedMethods.trim()) {
    methodParts.push(computedMethods)
  }

  const emitMethods = generateEmitMethods(options.emits)
  if (emitMethods.trim()) {
    methodParts.push(emitMethods)
  }

  const templateEventHandlers = generateTemplateEventHandlers(options.templateResult, options.emits)
  if (templateEventHandlers.trim()) {
    methodParts.push(templateEventHandlers)
  }

  methodParts.push(`    // 响应式系统设置
    _setupReactivity() {
${generateReactivitySetup(options.context)}
    }`)

  methodParts.push(`    // 更新计算属性
    _updateComputed() {
${generateComputedUpdate(options.computed)}
    }`)

  return methodParts.join(',\n\n')
}

/**
 * 生成用户定义的方法。
 */
function generateUserMethods(methods: Record<string, any>): string {
  const entries = Object.entries(methods).map(([name, method]) => {
    if (typeof method === 'function') {
      const funcStr = method.toString()
      return `    ${name}${funcStr.substring(funcStr.indexOf('('))}`
    }

    if (method && typeof method === 'object' && method.body) {
      return generateMethodFromBody(name, String(method.body))
    }

    if (typeof method === 'object' && method.type === 'function') {
      return `    ${name}() {
      // ${method.body}
      // TODO: 实现具体逻辑
    }`
    }

    return `    ${name}() {
      // 方法实现
    }`
  })

  return entries.join(',\n\n')
}

/**
 * 从脚本解析保留的函数体生成组件 method。
 */
function generateMethodFromBody(name: string, body: string): string {
  const trimmedBody = body.trim()
  const arrowMatch = trimmedBody.match(/^\((.*?)\)\s*=>\s*([\s\S]*)$/)

  if (arrowMatch) {
    const params = arrowMatch[1]
    let functionBody = (arrowMatch[2] || '').trim()
    if (functionBody.startsWith('{') && functionBody.endsWith('}')) {
      functionBody = functionBody.slice(1, -1).trim()
      return `    ${name}(${params}) {
      ${functionBody}
    }`
    }

    return `    ${name}(${params}) {
      return ${functionBody}
    }`
  }

  return `    ${name}() {
      ${trimmedBody}
    }`
}

/**
 * 生成 computed 方法。
 */
function generateComputedMethods(computed: Record<string, any>): string {
  const entries = Object.entries(computed).map(([name, config]) => {
    return `    _computed_${name}() {
      ${config.getter || 'return null'}
    }`
  })

  return entries.join(',\n\n')
}

/**
 * 生成事件发射方法。
 */
function generateEmitMethods(emits: string[]): string {
  const methods = emits.map(eventName => {
    const methodName = `_emit${toSafeMethodSuffix(eventName)}`
    return `    ${methodName}(detail) {
      this.triggerEvent('${eventName}', detail)
    }`
  })

  return methods.join(',\n\n')
}

/**
 * 生成模板事件处理器。
 */
function generateTemplateEventHandlers(templateResult: TemplateTransformResult, emits: string[]): string {
  const handlers: string[] = []

  templateResult.eventHandlers.forEach((handlerCode, handlerName) => {
    const inputHandler = generateTemplateInputHandler(handlerName, emits)
    if (inputHandler) {
      handlers.push(inputHandler)
      return
    }

    if (handlerName.startsWith('_handleUpdate_')) {
      const fieldName = handlerName.replace('_handleUpdate_', '')
      handlers.push(`    ${handlerName}(event) {
      this.setData({
        ${fieldName}: event.detail
      })
    }`)
      return
    }

    handlers.push(`    ${handlerName}(event) {
      ${handlerCode}
    }`)
  })

  return handlers.join(',\n\n')
}

/**
 * 按 handler 前缀生成输入类模板事件处理器。
 */
function generateTemplateInputHandler(handlerName: string, emits: string[]): string {
  const handlerConfigs = [
    ['_handleNumberInput_', 'parseFloat(event.detail.value) || 0'],
    ['_handleTrimInput_', 'event.detail.value.trim()'],
    ['_handleInput_', 'event.detail.value'],
    ['_handleRadio_', 'event.detail.value'],
    ['_handleCheckbox_', 'event.detail.value'],
    ['_handlePicker_', 'event.detail.value']
  ] as const

  const matchedConfig = handlerConfigs.find(([prefix]) => handlerName.startsWith(prefix))
  if (!matchedConfig) {
    return ''
  }

  const [prefix, valueExpression] = matchedConfig
  const fieldName = handlerName.replace(prefix, '')

  return `    ${handlerName}(event) {
      const value = ${valueExpression}
      this.setData({
        ${fieldName}: value
      })${generateModelTrigger(fieldName, emits)}
    }`
}

/**
 * 为 defineModel 对应的输入处理器补充 update:* 事件。
 */
function generateModelTrigger(fieldName: string, emits: string[]): string {
  const eventName = `update:${fieldName}`
  if (!emits.includes(eventName)) {
    return ''
  }

  return `\n      this.triggerEvent('${eventName}', value)`
}

/**
 * 生成响应式 setup。
 */
function generateReactivitySetup(context: TransformContext): string {
  const setup: string[] = []

  Object.keys(context.computed).forEach(name => {
    setup.push(`      // 设置计算属性: ${name}
      Object.defineProperty(this.data, '${name}', {
        get: () => this._computed_${name}(),
        enumerable: true,
        configurable: true
      })`)
  })

  return setup.join('\n')
}

/**
 * 生成 computed 更新逻辑。
 */
function generateComputedUpdate(computed: Record<string, any>): string {
  const computedKeys = Object.keys(computed)

  if (computedKeys.length === 0) {
    return '      // 没有计算属性需要更新'
  }

  const updates = computedKeys.map(key => `        ${key}: this._computed_${key}()`)

  return `      this.setData({
${updates.join(',\n')}
      })`
}

/**
 * 将事件名转换为安全的方法名后缀。
 */
function toSafeMethodSuffix(eventName: string): string {
  return eventName
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map(part => capitalize(part))
    .join('')
}

/**
 * 首字母大写。
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
