/**
 * defineEmits 代码生成辅助函数。
 */

import type { EmitInfo } from './define-emits-utils.js'

/**
 * 生成事件发射方法代码。
 */
export function generateEmitMethodsCode(emitInfos: EmitInfo[]): string {
  const methods = emitInfos.map(info => {
    const methodName = `_emit${capitalize(info.name)}`

    return `    ${methodName}(payload) {
      this.triggerEvent('${info.name}', payload)
    }`
  })

  return methods.join(',\n\n')
}

/**
 * 生成事件处理方法代码。
 */
export function generateEventHandlersCode(emitInfos: EmitInfo[]): string {
  const handlers = emitInfos.map(info => {
    const handlerName = `_handle${capitalize(info.name)}`
    const emitMethodName = `_emit${capitalize(info.name)}`

    return `    ${handlerName}(event) {
      const payload = event.detail
      this.${emitMethodName}(payload)
    }`
  })

  return handlers.join(',\n\n')
}

/**
 * 生成 v-model 更新方法代码。
 */
export function generateVModelUpdateCode(emitInfos: EmitInfo[]): string {
  const updateMethods: string[] = []

  emitInfos.forEach(info => {
    if (info.name.startsWith('update:')) {
      const propName = info.name.replace('update:', '')
      const methodName = `_handleUpdate_${propName.replace(/\./g, '_')}`

      updateMethods.push(`    ${methodName}(event) {
      const value = event.detail.value
      this.triggerEvent('${info.name}', value)
    }`)
    }
  })

  return updateMethods.join(',\n\n')
}

/**
 * 生成输入处理方法代码。
 */
export function generateInputHandlersCode(emitInfos: EmitInfo[]): string {
  const inputHandlers: string[] = []

  emitInfos.forEach(info => {
    if (info.name.startsWith('update:')) {
      const propName = info.name.replace('update:', '')

      inputHandlers.push(`    _handleInput_${propName.replace(/\./g, '_')}(event) {
      const value = event.detail.value
      this.setData({
        ${propName}: value
      })
      this.triggerEvent('${info.name}', value)
    }`)

      inputHandlers.push(`    _handleNumberInput_${propName.replace(/\./g, '_')}(event) {
      const value = parseFloat(event.detail.value) || 0
      this.setData({
        ${propName}: value
      })
      this.triggerEvent('${info.name}', value)
    }`)

      inputHandlers.push(`    _handleTrimInput_${propName.replace(/\./g, '_')}(event) {
      const value = event.detail.value.trim()
      this.setData({
        ${propName}: value
      })
      this.triggerEvent('${info.name}', value)
    }`)
    }
  })

  return inputHandlers.join(',\n\n')
}

/**
 * 检查是否包含 v-model 事件。
 */
export function hasVModelEvents(emitInfos: EmitInfo[]): boolean {
  return emitInfos.some(info => info.name.startsWith('update:'))
}

/**
 * 获取 v-model 属性名列表。
 */
export function getVModelProps(emitInfos: EmitInfo[]): string[] {
  return emitInfos
    .filter(info => info.name.startsWith('update:'))
    .map(info => info.name.replace('update:', ''))
}

/**
 * 验证事件名称。
 */
export function validateEventName(name: string): { valid: boolean; message?: string } {
  if (!/^[a-zA-Z][a-zA-Z0-9:_-]*$/.test(name)) {
    return {
      valid: false,
      message: `事件名称 "${name}" 格式不正确，应该以字母开头，只包含字母、数字、冒号、下划线和连字符`
    }
  }

  const reservedEvents = ['tap', 'input', 'change', 'focus', 'blur', 'submit', 'reset']
  if (reservedEvents.includes(name)) {
    return {
      valid: false,
      message: `事件名称 "${name}" 是保留名称，请使用其他名称`
    }
  }

  return { valid: true }
}

/**
 * 生成事件文档。
 */
export function generateEventDocs(emitInfos: EmitInfo[]): string {
  const docs = emitInfos.map(info => {
    return `/**
 * ${info.name} 事件
 * @param {any} payload 事件载荷
 */`
  })

  return docs.join('\n')
}

/** 首字母大写。 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
