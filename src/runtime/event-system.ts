/**
 * 事件系统运行时适配
 */

/**
 * 事件管理器
 */
export class EventManager {
  private listeners: Map<string, Function[]> = new Map()
  private context: any

  constructor(context: any) {
    this.context = context
  }

  /**
   * 添加事件监听器
   */
  addEventListener(event: string, listener: Function): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }

    this.listeners.get(event)!.push(listener)

    // 返回移除监听器的函数
    return () => {
      const listeners = this.listeners.get(event)
      if (listeners) {
        const index = listeners.indexOf(listener)
        if (index > -1) {
          listeners.splice(index, 1)
        }
      }
    }
  }

  /**
   * 移除事件监听器
   */
  removeEventListener(event: string, listener: Function): void {
    const listeners = this.listeners.get(event)
    if (listeners) {
      const index = listeners.indexOf(listener)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  /**
   * 触发事件
   */
  emit(event: string, ...args: any[]): void {
    const listeners = this.listeners.get(event)
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener.apply(this.context, args)
        } catch (error) {
          console.error(`事件 ${event} 处理失败:`, error)
        }
      })
    }
  }

  /**
   * 清理所有监听器
   */
  cleanup(): void {
    this.listeners.clear()
  }
}

/**
 * 事件修饰符处理器
 */
export class EventModifierHandler {
  /**
   * 处理事件修饰符
   */
  static handleModifiers(
    event: any,
    modifiers: string[],
    handler: Function
  ): void {
    // 阻止默认行为
    if (modifiers.includes('prevent')) {
      if (event.preventDefault) {
        event.preventDefault()
      }
    }

    // 阻止事件冒泡
    if (modifiers.includes('stop')) {
      if (event.stopPropagation) {
        event.stopPropagation()
      }
    }

    // 只在当前元素触发
    if (modifiers.includes('self')) {
      if (event.target !== event.currentTarget) {
        return
      }
    }

    // 只触发一次
    if (modifiers.includes('once')) {
      // 在小程序中需要手动管理
      const target = event.currentTarget
      if (target._onceHandled) {
        return
      }
      target._onceHandled = true
    }

    // 按键修饰符
    if (modifiers.some(mod => ['enter', 'tab', 'delete', 'esc', 'space'].includes(mod))) {
      if (!this.checkKeyModifier(event, modifiers)) {
        return
      }
    }

    // 执行处理函数
    handler(event)
  }

  /**
   * 检查按键修饰符
   */
  private static checkKeyModifier(event: any, modifiers: string[]): boolean {
    const keyCode = event.detail?.keyCode || event.keyCode

    const keyMap: Record<string, number> = {
      enter: 13,
      tab: 9,
      delete: 46,
      esc: 27,
      space: 32
    }

    return modifiers.some(mod => keyMap[mod] === keyCode)
  }
}

/**
 * v-model 事件处理器
 */
export class VModelHandler {
  /**
   * 处理 v-model 输入事件
   */
  static handleInput(
    event: any,
    property: string,
    modifiers: string[],
    context: any
  ): void {
    let value = event.detail.value

    // 处理修饰符
    if (modifiers.includes('number')) {
      value = parseFloat(value) || 0
    } else if (modifiers.includes('trim')) {
      value = value.trim()
    }

    // 更新数据
    context.setData({
      [property]: value
    })

    // 触发 update 事件
    const updateEvent = `update:${property}`
    if (context.triggerEvent) {
      context.triggerEvent(updateEvent, value)
    }
  }

  /**
   * 处理复选框 v-model
   */
  static handleCheckbox(
    event: any,
    property: string,
    context: any
  ): void {
    const checked = event.detail.value

    context.setData({
      [property]: checked
    })

    const updateEvent = `update:${property}`
    if (context.triggerEvent) {
      context.triggerEvent(updateEvent, checked)
    }
  }

  /**
   * 处理单选框 v-model
   */
  static handleRadio(
    event: any,
    property: string,
    context: any
  ): void {
    const value = event.detail.value

    context.setData({
      [property]: value
    })

    const updateEvent = `update:${property}`
    if (context.triggerEvent) {
      context.triggerEvent(updateEvent, value)
    }
  }

  /**
   * 处理选择器 v-model
   */
  static handlePicker(
    event: any,
    property: string,
    context: any
  ): void {
    const value = event.detail.value

    context.setData({
      [property]: value
    })

    const updateEvent = `update:${property}`
    if (context.triggerEvent) {
      context.triggerEvent(updateEvent, value)
    }
  }
}

/**
 * 事件委托处理器
 */
export class EventDelegator {
  private static delegatedEvents = new Set(['tap', 'input', 'change'])

  /**
   * 设置事件委托
   */
  static setupDelegation(context: any): void {
    this.delegatedEvents.forEach(eventType => {
      const handlerName = `_handle${this.capitalize(eventType)}`

      if (!context[handlerName]) {
        context[handlerName] = (event: any) => {
          this.handleDelegatedEvent(event, eventType, context)
        }
      }
    })
  }

  /**
   * 处理委托事件
   */
  private static handleDelegatedEvent(
    event: any,
    eventType: string,
    context: any
  ): void {
    const { dataset } = event.currentTarget
    const { handler, modifiers, property } = dataset

    if (!handler) return

    // 解析修饰符
    const modifierList = modifiers ? modifiers.split(',') : []

    // 处理 v-model
    if (property) {
      switch (eventType) {
        case 'input':
          VModelHandler.handleInput(event, property, modifierList, context)
          break
        case 'change':
          if (event.currentTarget.type === 'checkbox') {
            VModelHandler.handleCheckbox(event, property, context)
          } else if (event.currentTarget.type === 'radio') {
            VModelHandler.handleRadio(event, property, context)
          } else {
            VModelHandler.handlePicker(event, property, context)
          }
          break
      }
    }

    // 执行自定义处理函数
    if (handler && context[handler]) {
      EventModifierHandler.handleModifiers(
        event,
        modifierList,
        context[handler].bind(context)
      )
    }
  }

  /**
   * 首字母大写
   */
  private static capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }
}

/**
 * 事件工具函数
 */
export class EventUtils {
  /**
   * 创建事件对象
   */
  static createEvent(type: string, detail: any = {}): any {
    return {
      type,
      detail,
      timeStamp: Date.now(),
      target: null,
      currentTarget: null
    }
  }

  /**
   * 节流函数
   */
  static throttle(func: Function, delay: number): Function {
    let lastCall = 0
    return function (this: any, ...args: any[]) {
      const now = Date.now()
      if (now - lastCall >= delay) {
        lastCall = now
        return func.apply(this, args)
      }
    }
  }

  /**
   * 防抖函数
   */
  static debounce(func: Function, delay: number): Function {
    let timeoutId: any
    return function (this: any, ...args: any[]) {
      const self = this
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => func.apply(self, args), delay)
    }
  }

  /**
   * 获取事件坐标
   */
  static getEventCoordinates(event: any): { x: number; y: number } {
    const touch = event.touches?.[0] || event.changedTouches?.[0]
    if (touch) {
      return {
        x: touch.clientX || touch.pageX,
        y: touch.clientY || touch.pageY
      }
    }
    return { x: 0, y: 0 }
  }
}

/**
 * 设置事件系统
 */
export function setupEventSystem(context: any): void {
  // 创建事件管理器
  context._eventManager = new EventManager(context)

  // 设置事件委托
  EventDelegator.setupDelegation(context)

  // 添加通用事件方法
  context.$emit = function (event: string, ...args: any[]) {
    if (this.triggerEvent) {
      this.triggerEvent(event, args[0])
    }
    this._eventManager.emit(event, ...args)
  }

  context.$on = function (event: string, listener: Function) {
    return this._eventManager.addEventListener(event, listener)
  }

  context.$off = function (event: string, listener: Function) {
    this._eventManager.removeEventListener(event, listener)
  }
}

/**
 * 清理事件系统
 */
export function cleanupEventSystem(context: any): void {
  if (context._eventManager) {
    context._eventManager.cleanup()
    delete context._eventManager
  }

  // 清理添加的方法
  delete context.$emit
  delete context.$on
  delete context.$off
}
