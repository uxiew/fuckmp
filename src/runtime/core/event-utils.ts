/**
 * 事件系统纯函数工具。
 */

import type { EventConfig, TwoWayBinding } from './event.js'

const KEY_MODIFIER_MAP: Record<string, string | number> = {
  enter: 'Enter',
  tab: 'Tab',
  delete: 'Delete',
  esc: 'Escape',
  space: ' ',
  up: 'ArrowUp',
  down: 'ArrowDown',
  left: 'ArrowLeft',
  right: 'ArrowRight'
}

/** 合并事件系统配置默认值。 */
export function createEventConfig(config: EventConfig = {}): Required<EventConfig> {
  return {
    debug: false,
    enableTwoWayBinding: true,
    enableEventModifiers: true,
    ...config
  }
}

/** 判断是否需要设置双向绑定。 */
export function shouldSetupTwoWayBindings(
  bindings: Record<string, TwoWayBinding> | undefined,
  config: EventConfig
): boolean {
  return Boolean(bindings && config.enableTwoWayBinding)
}

/** 获取双向绑定 handler 名称。 */
export function getBindingHandlerName(name: string): string {
  return `_handle_${name}_binding`
}

/** 从小程序事件对象中提取双向绑定值。 */
export function extractTwoWayBindingValue(event: any): any {
  return event.detail?.value ?? event.detail
}

/** 构造双向绑定 setData 更新对象。 */
export function createBindingUpdate(property: string, value: any): Record<string, any> {
  return { [property]: value }
}

/** 将双向绑定值写入小程序实例。 */
export function applyTwoWayBindingValueToInstance(instance: any, property: string, value: any): void {
  const updateData = createBindingUpdate(property, value)

  if (instance.setData) {
    instance.setData(updateData)
    return
  }

  instance.data = instance.data || {}
  instance.data[property] = value
}

/** 应用事件修饰符，保持原事件系统的阻止规则。 */
export function applyEventModifiers(event: any, modifiers: string[]): any {
  const modifiedEvent = { ...event }

  for (const modifier of modifiers) {
    switch (modifier) {
      case 'stop':
        if (modifiedEvent.stopPropagation) {
          modifiedEvent.stopPropagation()
        }
        break
      case 'prevent':
        if (modifiedEvent.preventDefault) {
          modifiedEvent.preventDefault()
        }
        break
      case 'self':
        if (modifiedEvent.target !== modifiedEvent.currentTarget) {
          return null
        }
        break
      case 'capture':
        break
      case 'once':
        break
      case 'passive':
        break
      default:
        if (isKeyModifier(modifier, modifiedEvent)) {
          return null
        }
    }
  }

  return modifiedEvent
}

/** 判断键盘修饰符是否阻止当前事件。 */
export function isKeyModifier(modifier: string, event: any): boolean {
  if (!event.key && !event.keyCode) {
    return false
  }

  const expectedKey = KEY_MODIFIER_MAP[modifier]
  if (expectedKey) {
    return event.key !== expectedKey && event.keyCode !== expectedKey
  }

  if (modifier.length === 1) {
    return event.key !== modifier
  }

  return false
}
