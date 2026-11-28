/**
 * 原生模板事件处理器生成工具。
 */

import type { TemplateTransformResult } from '@/transformer/index.js'

/**
 * 生成页面模板派生的事件处理器。
 */
export function generatePageTemplateHandlers(templateResult?: TemplateTransformResult): Record<string, string> {
  const handlers: Record<string, string> = {}

  templateResult?.eventHandlers.forEach((_handlerCode, handlerName) => {
    if (!handlerName.startsWith('_handleUpdate_')) {
      return
    }

    const fieldName = handlerName.replace('_handleUpdate_', '')
    handlers[handlerName] = `function(event) {
    this.setData({
      ${fieldName}: event.detail
    })
    this._updateComputed()
  }`
  })

  return handlers
}

/**
 * 生成组件模板派生的事件处理器。
 */
export function generateComponentTemplateHandlers(
  templateResult: TemplateTransformResult | undefined,
  emits: string[] = []
): Record<string, string> {
  const handlers: Record<string, string> = {}

  templateResult?.eventHandlers.forEach((handlerCode, handlerName) => {
    if (handlerName.startsWith('_handleInput_')) {
      const fieldName = handlerName.replace('_handleInput_', '')
      handlers[handlerName] = generateInputHandler(fieldName, 'event.detail.value', emits)
    } else if (handlerName.startsWith('_handleNumberInput_')) {
      const fieldName = handlerName.replace('_handleNumberInput_', '')
      handlers[handlerName] = generateInputHandler(fieldName, 'parseFloat(event.detail.value) || 0', emits)
    } else if (handlerName.startsWith('_handleTrimInput_')) {
      const fieldName = handlerName.replace('_handleTrimInput_', '')
      handlers[handlerName] = generateInputHandler(fieldName, 'event.detail.value.trim()', emits)
    } else if (handlerName.startsWith('_handleRadio_')) {
      const fieldName = handlerName.replace('_handleRadio_', '')
      handlers[handlerName] = generateInputHandler(fieldName, 'event.detail.value', emits)
    } else if (handlerName.startsWith('_handleCheckbox_')) {
      const fieldName = handlerName.replace('_handleCheckbox_', '')
      handlers[handlerName] = generateInputHandler(fieldName, 'event.detail.value', emits)
    } else if (handlerName.startsWith('_handlePicker_')) {
      const fieldName = handlerName.replace('_handlePicker_', '')
      handlers[handlerName] = generateInputHandler(fieldName, 'event.detail.value', emits)
    } else if (handlerName.startsWith('_handleUpdate_')) {
      const fieldName = handlerName.replace('_handleUpdate_', '')
      handlers[handlerName] = `function(event) {
    this.setData({
      ${fieldName}: event.detail
    })
    this._updateComputed()
  }`
    }
  })

  return handlers
}

/**
 * 生成 computed 运行时方法和更新入口。
 */
export function generateComputedRuntimeMethods(computed: Record<string, any> = {}): Record<string, string> {
  const methods: Record<string, string> = {}
  const computedKeys = Object.keys(computed)

  computedKeys.forEach(name => {
    const getter = computed[name]?.getter || 'return null'
    methods[`_computed_${name}`] = `function() {
    ${ensureReturnStatement(getter)}
  }`
  })

  methods._updateComputed = computedKeys.length > 0
    ? `function() {
    for (const key of ${JSON.stringify(computedKeys)}) {
      if (this[key]?._isComputed) this[key]._dirty = true;
    }
    this.setData({
${computedKeys.map(key => `      ${key}: this._computed_${key}()`).join(',\n')}
    })
  }`
    : `function() {
    // 没有计算属性需要更新
  }`

  return methods
}

/**
 * 生成单个输入类处理器。
 */
function generateInputHandler(fieldName: string, valueExpression: string, emits: string[]): string {
  return `function(event) {
    const value = ${valueExpression}
    this.setData({
      ${fieldName}: value
    })${generateModelTrigger(fieldName, emits)}
    this._updateComputed()
  }`
}

/**
 * 为 defineModel 对应输入处理器补充 update:* 事件。
 */
function generateModelTrigger(fieldName: string, emits: string[]): string {
  const eventName = `update:${fieldName}`
  if (!emits.includes(eventName)) {
    return ''
  }

  return `\n    this.triggerEvent('${eventName}', value)`
}

/**
 * 将表达式型 computed getter 规范为函数体。
 */
function ensureReturnStatement(getter: string): string {
  const trimmed = getter.trim()
  if (!trimmed) {
    return 'return null'
  }

  if (
    trimmed.startsWith('return ') ||
    trimmed.startsWith('if ') ||
    trimmed.startsWith('if(') ||
    trimmed.includes('\nreturn ')
  ) {
    return trimmed
  }

  return `return ${trimmed}`
}
