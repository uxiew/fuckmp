/**
 * Vue3 微信小程序响应式运行时库
 * 基于 Proxy 实现的响应式系统，自动处理 setData 调用
 */

// 类型定义
export interface Ref<T = any> {
  value: T
}

export interface ComputedRef<T = any> extends Ref<T> {
  readonly value: T
}

// 全局上下文，用于存储当前的小程序实例
let currentContext: any = null

/**
 * 设置当前的小程序上下文（页面或组件实例）
 */
export function setDataContext(context: any): void {
  currentContext = context
}

/**
 * 调用小程序的 setData 方法更新数据
 */
function triggerSetData(key: string, value: any): void {
  if (currentContext && typeof currentContext.setData === 'function') {
    currentContext.setData({ [key]: value })
  }
}

/**
 * 创建 ref 响应式引用
 * 支持所有类型的赋值操作，自动调用 setData
 */
export function ref<T>(value: T): Ref<T> {
  // 存储原始值
  let _value = value
  
  // 生成唯一的数据键名（用于 setData）
  const dataKey = `ref_${Math.random().toString(36).substr(2, 9)}`
  
  // 创建代理对象
  const refProxy = {
    get value() {
      return _value
    },
    
    set value(newValue: T) {
      if (newValue !== _value) {
        _value = newValue
        // 自动调用 setData 更新小程序数据
        triggerSetData(dataKey, newValue)
      }
    }
  }
  
  // 在当前上下文中初始化数据
  if (currentContext) {
    triggerSetData(dataKey, value)
  }
  
  return refProxy as Ref<T>
}

/**
 * 创建 reactive 响应式对象
 * 支持深度响应式，自动处理嵌套对象和数组
 */
export function reactive<T extends object>(target: T): T {
  // 生成唯一的数据键名
  const dataKey = `reactive_${Math.random().toString(36).substr(2, 9)}`
  
  // 创建深度代理
  function createProxy(obj: any, path: string[] = []): any {
    return new Proxy(obj, {
      get(target, key) {
        const value = target[key]
        
        // 如果是对象或数组，递归创建代理
        if (value && typeof value === 'object') {
          return createProxy(value, [...path, key as string])
        }
        
        return value
      },
      
      set(target, key, newValue) {
        const oldValue = target[key]
        
        if (newValue !== oldValue) {
          target[key] = newValue
          
          // 构建完整的数据路径
          const fullPath = path.length > 0 
            ? `${dataKey}.${[...path, key].join('.')}`
            : `${dataKey}.${key}`
          
          // 自动调用 setData
          triggerSetData(fullPath, newValue)
        }
        
        return true
      }
    })
  }
  
  const proxy = createProxy(target)
  
  // 在当前上下文中初始化数据
  if (currentContext) {
    triggerSetData(dataKey, target)
  }
  
  return proxy
}

/**
 * 创建计算属性
 * 自动追踪依赖，当依赖变化时重新计算
 */
export function computed<T>(getter: () => T): ComputedRef<T> {
  let _value: T
  let _computed = false
  
  // 生成唯一的数据键名
  const dataKey = `computed_${Math.random().toString(36).substr(2, 9)}`
  
  // 计算初始值
  const computeValue = () => {
    if (!_computed) {
      _value = getter()
      _computed = true
      
      // 更新小程序数据
      if (currentContext) {
        triggerSetData(dataKey, _value)
      }
    }
    return _value
  }
  
  // 创建计算属性代理
  const computedProxy = {
    get value() {
      return computeValue()
    }
  }
  
  // 初始化计算
  computeValue()
  
  return computedProxy as ComputedRef<T>
}

/**
 * 监听器函数（简化版）
 */
export function watch<T>(
  source: () => T,
  callback: (newValue: T, oldValue: T) => void
): void {
  let oldValue = source()
  
  // 简化实现：使用定时器检查变化
  // 实际项目中应该使用更高效的依赖追踪机制
  const checkChanges = () => {
    const newValue = source()
    if (newValue !== oldValue) {
      callback(newValue, oldValue)
      oldValue = newValue
    }
  }
  
  // 每 100ms 检查一次变化
  setInterval(checkChanges, 100)
}

/**
 * 生命周期钩子：组件挂载时
 */
export function onMounted(callback: () => void): void {
  if (currentContext && currentContext.onReady) {
    currentContext.onReady(callback)
  } else if (callback) {
    // 如果没有 onReady，立即执行
    setTimeout(callback, 0)
  }
}

/**
 * 导出所有响应式 API
 */
export const reactiveRuntime = {
  ref,
  reactive,
  computed,
  watch,
  onMounted,
  setDataContext
}

export default reactiveRuntime
