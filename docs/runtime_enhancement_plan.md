# Vue3 微信小程序运行时增强方案

## 📋 技术方案概述

基于对 `vue-mini` 和 `@52css/mp-vue3` 项目的深入调研，建议采用**运行时代理方案**来彻底解决响应式变量更新问题。

## 🔍 调研结果分析

### vue-mini 架构特点
- 使用 `reactive` 和 `computed` 创建响应式状态
- `state.count++` 自动触发视图更新
- setup 返回的数据自动合并到页面实例

### @52css/mp-vue3 架构特点
- 使用 `ref` 创建响应式数据
- `count.value++` 自动响应到 `this.data.count`
- 支持完整的 Pinia 状态管理

### 核心发现
**两个项目都采用了运行时响应式代理机制，而不是编译时转换！**

## 🚨 当前方案的局限性

### 字符串替换方案的问题
1. **覆盖不全**: 只能处理 `++` 操作符
2. **不可靠**: 无法处理 `+=`、`-=`、`*=`、`/=` 等复合赋值
3. **不支持复杂操作**: 无法处理嵌套对象、数组操作
4. **维护困难**: 字符串替换容易出错，难以扩展
5. **性能问题**: 每次都需要重新解析和替换

## 🎯 推荐技术方案

### 方案选择：增强现有运行时系统

**优点**:
- 基于现有架构，风险较低
- 可以渐进式实现，先支持基本功能
- 与现有编译器完美集成
- 更好的可维护性和扩展性

**缺点**:
- 需要重构部分运行时代码
- 需要处理各种边界情况

## 📅 实施计划

### 阶段一：核心响应式 API 实现（2-3天）

#### 1.1 增强运行时库
```typescript
// 在现有 runtime-injection.js 基础上增加
class Vue3ReactiveSystem {
  constructor(context) {
    this.context = context // 小程序页面/组件实例
    this.refs = new Map()
    this.reactives = new Map()
    this.computeds = new Map()
  }

  // 实现 ref API
  ref(value) {
    const refId = this.generateId()
    const refProxy = {
      get value() { return value },
      set value(newValue) {
        if (newValue !== value) {
          value = newValue
          this.context.setData({ [refId]: newValue })
        }
      }
    }
    this.refs.set(refId, refProxy)
    return refProxy
  }

  // 实现 reactive API
  reactive(target) {
    const reactiveId = this.generateId()
    const proxy = new Proxy(target, {
      set(obj, prop, value) {
        if (obj[prop] !== value) {
          obj[prop] = value
          this.context.setData({ [`${reactiveId}.${prop}`]: value })
        }
        return true
      }
    })
    this.reactives.set(reactiveId, proxy)
    return proxy
  }

  // 实现 computed API
  computed(getter) {
    const computedId = this.generateId()
    let cachedValue
    let isDirty = true
    
    const computedProxy = {
      get value() {
        if (isDirty) {
          cachedValue = getter()
          isDirty = false
          this.context.setData({ [computedId]: cachedValue })
        }
        return cachedValue
      }
    }
    this.computeds.set(computedId, computedProxy)
    return computedProxy
  }
}
```

#### 1.2 集成到现有运行时
- 修改 `createPage` 和 `createComponent` 方法
- 在页面/组件初始化时创建响应式系统实例
- 提供全局的 `ref`、`reactive`、`computed` API

### 阶段二：编译器集成（1天）

#### 2.1 移除字符串替换逻辑
- 删除 `generateUpdateExpression` 中的字符串替换
- 删除 `transformFunctionBody` 方法
- 保持原始的 Vue 代码不变

#### 2.2 运行时 API 注入
- 在生成的页面/组件代码中注入响应式 API
- 确保 `ref`、`reactive`、`computed` 在运行时可用
- 处理 setup 函数的返回值绑定

### 阶段三：测试验证（1天）

#### 3.1 单元测试
```typescript
describe('Vue3 响应式运行时', () => {
  it('应该支持 ref 的所有操作', () => {
    const count = ref(0)
    count.value++           // 自增
    count.value += 5        // 复合赋值
    count.value = 10        // 直接赋值
    // 验证 setData 调用
  })

  it('应该支持 reactive 的嵌套操作', () => {
    const user = reactive({ name: 'test', age: 20 })
    user.name = 'new name'  // 属性修改
    user.age += 1           // 复合赋值
    // 验证 setData 调用
  })

  it('应该支持 computed 的依赖追踪', () => {
    const count = ref(0)
    const double = computed(() => count.value * 2)
    count.value = 5
    expect(double.value).toBe(10)
  })
})
```

#### 3.2 集成测试
- 验证完整的编译流程
- 测试各种响应式操作场景
- 确保与现有功能的兼容性

## 🔧 技术实现细节

### 响应式代理机制
```typescript
// 核心思想：拦截所有属性访问和修改
const refProxy = new Proxy(refObject, {
  get(target, prop) {
    if (prop === 'value') {
      return target._value
    }
    return target[prop]
  },
  set(target, prop, value) {
    if (prop === 'value' && value !== target._value) {
      target._value = value
      // 自动调用 setData
      context.setData({ [target._key]: value })
    }
    return true
  }
})
```

### 依赖追踪系统
```typescript
// 简化的依赖追踪（可以后续优化）
class DependencyTracker {
  constructor() {
    this.activeEffect = null
    this.deps = new Map()
  }

  track(target, key) {
    if (this.activeEffect) {
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
  }

  trigger(target, key) {
    const depsMap = this.deps.get(target)
    if (!depsMap) return
    const dep = depsMap.get(key)
    if (dep) {
      dep.forEach(effect => effect())
    }
  }
}
```

## 🎯 预期效果

### 支持的操作类型
```typescript
// ✅ 所有这些操作都将自动触发 setData
const count = ref(0)
count.value++              // 自增
count.value--              // 自减
count.value += 5           // 复合赋值
count.value -= 3           // 复合赋值
count.value *= 2           // 复合赋值
count.value /= 2           // 复合赋值
count.value = 100          // 直接赋值

const user = reactive({ name: 'test', profile: { age: 20 } })
user.name = 'new name'     // 属性修改
user.profile.age++         // 嵌套属性修改

const list = ref([1, 2, 3])
list.value.push(4)         // 数组操作
list.value.splice(0, 1)    // 数组操作
```

### 性能优化
- 只在实际修改时才调用 setData
- 批量更新机制，避免频繁的 setData 调用
- 智能依赖追踪，只更新真正变化的数据

## 📈 长期规划

### 第一阶段：基础响应式（当前）
- ref、reactive、computed 基础实现
- 自动 setData 调用
- 基本的依赖追踪

### 第二阶段：高级特性
- watch、watchEffect 实现
- provide/inject 支持
- 更精确的依赖追踪

### 第三阶段：性能优化
- 批量更新机制
- 虚拟 DOM diff（可选）
- 更智能的 setData 优化

## 🔄 迁移策略

### 向后兼容
- 保持现有 API 不变
- 渐进式启用新功能
- 提供配置选项控制行为

### 平滑过渡
1. 先实现基础功能，确保不破坏现有代码
2. 逐步替换字符串替换逻辑
3. 最终完全迁移到运行时代理方案

这个方案可以彻底解决当前的响应式更新问题，并为未来的功能扩展奠定坚实基础。
