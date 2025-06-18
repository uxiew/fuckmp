/**
 * Vue3 微信小程序响应式系统核心模块
 * 基于 Proxy 实现完整的响应式功能
 */

export interface ReactiveContext {
  setData: (data: Record<string, any>) => void
  data: Record<string, any>
}

export interface RefObject<T = any> {
  value: T
  _isRef: true
  _key: string
}

export interface ComputedRef<T = any> {
  readonly value: T
  _isComputed: true
  _key: string
}

/**
 * 响应式系统核心类
 */
export class ReactiveSystem {
  private context: ReactiveContext
  private refs = new Map<string, RefObject>()
  private reactives = new Map<string, any>()
  private computeds = new Map<string, ComputedRef>()
  private effects = new Set<() => void>()
  private activeEffect: (() => void) | null = null
  private deps = new Map<any, Map<string, Set<() => void>>>()

  constructor(context: ReactiveContext) {
    this.context = context
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9)
  }

  /**
   * 依赖追踪
   */
  private track(target: any, key: string): void {
    if (!this.activeEffect) return
    
    let depsMap = this.deps.get(target)
    if (!depsMap) {
      this.deps.set(target, (depsMap = new Map()))
    }
    
    let dep = depsMap.get(key)
    if (!dep) {
      depsMap.set(key, (dep = new Set()))
    }
    
    dep.add(this.activeEffect)
  }

  /**
   * 触发更新
   */
  private trigger(target: any, key: string): void {
    const depsMap = this.deps.get(target)
    if (!depsMap) return
    
    const dep = depsMap.get(key)
    if (dep) {
      dep.forEach(effect => {
        if (effect !== this.activeEffect) {
          effect()
        }
      })
    }
  }

  /**
   * 执行副作用函数
   */
  private runEffect(fn: () => void): void {
    const prevEffect = this.activeEffect
    this.activeEffect = fn
    try {
      fn()
    } finally {
      this.activeEffect = prevEffect
    }
  }

  /**
   * 创建 ref 响应式引用
   */
  ref<T>(value: T): RefObject<T> {
    const key = `ref_${this.generateId()}`
    let _value = value

    const refObject = {
      _isRef: true as const,
      _key: key,
      get value(): T {
        this.track(refObject, 'value')
        return _value
      },
      set value(newValue: T) {
        if (newValue !== _value) {
          _value = newValue
          // 立即更新小程序数据
          this.context.setData({ [key]: newValue })
          // 触发依赖更新
          this.trigger(refObject, 'value')
        }
      }
    }

    // 绑定 track 和 trigger 方法到正确的上下文
    const self = this
    Object.defineProperty(refObject, 'track', {
      value: (target: any, key: string) => self.track(target, key),
      writable: false,
      enumerable: false
    })

    // 初始化数据
    this.context.setData({ [key]: value })
    this.refs.set(key, refObject)

    return refObject as RefObject<T>
  }

  /**
   * 创建 reactive 响应式对象
   */
  reactive<T extends object>(target: T): T {
    const key = `reactive_${this.generateId()}`
    const self = this

    function createProxy(obj: any, path: string[] = []): any {
      return new Proxy(obj, {
        get(target, prop: string | symbol) {
          if (typeof prop === 'string') {
            const fullPath = path.length > 0 ? `${path.join('.')}.${prop}` : prop
            self.track(target, fullPath)
          }
          
          const value = target[prop]
          
          // 如果是对象，递归创建代理
          if (value && typeof value === 'object' && typeof prop === 'string') {
            return createProxy(value, [...path, prop])
          }
          
          return value
        },

        set(target, prop: string | symbol, newValue) {
          if (typeof prop === 'string') {
            const oldValue = target[prop]
            
            if (newValue !== oldValue) {
              target[prop] = newValue
              
              // 构建完整的数据路径
              const fullPath = path.length > 0 
                ? `${key}.${[...path, prop].join('.')}`
                : `${key}.${prop}`
              
              // 更新小程序数据
              self.context.setData({ [fullPath]: newValue })
              
              // 触发依赖更新
              const trackPath = path.length > 0 ? `${path.join('.')}.${prop}` : prop
              self.trigger(target, trackPath)
            }
          }
          
          return true
        }
      })
    }

    const proxy = createProxy(target)
    
    // 初始化数据
    this.context.setData({ [key]: target })
    this.reactives.set(key, proxy)

    return proxy
  }

  /**
   * 创建计算属性
   */
  computed<T>(getter: () => T): ComputedRef<T> {
    const key = `computed_${this.generateId()}`
    let _value: T
    let _dirty = true

    const computedRef = {
      _isComputed: true as const,
      _key: key,
      get value(): T {
        if (_dirty) {
          // 在计算过程中追踪依赖
          this.runEffect(() => {
            _value = getter()
          })
          _dirty = false
          
          // 更新小程序数据
          this.context.setData({ [key]: _value })
        }
        
        this.track(computedRef, 'value')
        return _value
      }
    }

    // 绑定方法到正确的上下文
    const self = this
    Object.defineProperty(computedRef, 'track', {
      value: (target: any, key: string) => self.track(target, key),
      writable: false,
      enumerable: false
    })
    Object.defineProperty(computedRef, 'runEffect', {
      value: (fn: () => void) => self.runEffect(fn),
      writable: false,
      enumerable: false
    })

    // 注册副作用，当依赖变化时重新计算
    this.effects.add(() => {
      _dirty = true
      // 重新计算并更新
      const newValue = computedRef.value
    })

    // 初始计算
    const initialValue = computedRef.value
    this.computeds.set(key, computedRef)

    return computedRef as ComputedRef<T>
  }

  /**
   * 监听器函数
   */
  watch<T>(
    source: () => T,
    callback: (newValue: T, oldValue: T) => void,
    options: { immediate?: boolean } = {}
  ): () => void {
    let oldValue = options.immediate ? undefined : source()
    
    const effect = () => {
      const newValue = source()
      if (newValue !== oldValue) {
        callback(newValue, oldValue as T)
        oldValue = newValue
      }
    }

    // 如果需要立即执行
    if (options.immediate) {
      oldValue = source()
      callback(oldValue as T, undefined as any)
    }

    // 注册副作用
    this.runEffect(effect)
    this.effects.add(effect)

    // 返回停止监听的函数
    return () => {
      this.effects.delete(effect)
    }
  }

  /**
   * 清理资源
   */
  dispose(): void {
    this.refs.clear()
    this.reactives.clear()
    this.computeds.clear()
    this.effects.clear()
    this.deps.clear()
    this.activeEffect = null
  }

  /**
   * 获取所有响应式数据的当前值（用于调试）
   */
  getReactiveData(): Record<string, any> {
    const data: Record<string, any> = {}
    
    // 收集 ref 数据
    this.refs.forEach((ref, key) => {
      data[key] = ref.value
    })
    
    // 收集 reactive 数据
    this.reactives.forEach((reactive, key) => {
      data[key] = reactive
    })
    
    // 收集 computed 数据
    this.computeds.forEach((computed, key) => {
      data[key] = computed.value
    })
    
    return data
  }
}

/**
 * 全局响应式 API
 */
export function createReactiveAPI(reactiveSystem: ReactiveSystem) {
  return {
    ref: <T>(value: T) => reactiveSystem.ref(value),
    reactive: <T extends object>(target: T) => reactiveSystem.reactive(target),
    computed: <T>(getter: () => T) => reactiveSystem.computed(getter),
    watch: <T>(
      source: () => T,
      callback: (newValue: T, oldValue: T) => void,
      options?: { immediate?: boolean }
    ) => reactiveSystem.watch(source, callback, options)
  }
}
