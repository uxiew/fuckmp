/**
 * Vue 相关类型定义
 */

/**
 * Vue3 宏定义
 */
export const VUE3_MACROS = {
  // <script setup> 编译时宏
  defineProps: 'defineProps',
  defineEmits: 'defineEmits',
  defineExpose: 'defineExpose',
  defineOptions: 'defineOptions',
  defineSlots: 'defineSlots',
  defineModel: 'defineModel',
  withDefaults: 'withDefaults',
  
  // 运行时 API
  ref: 'ref',
  reactive: 'reactive',
  computed: 'computed',
  watch: 'watch',
  watchEffect: 'watchEffect',
  onMounted: 'onMounted',
  onUnmounted: 'onUnmounted',
  onUpdated: 'onUpdated',
  onBeforeMount: 'onBeforeMount',
  onBeforeUnmount: 'onBeforeUnmount',
  onBeforeUpdate: 'onBeforeUpdate',
  onActivated: 'onActivated',
  onDeactivated: 'onDeactivated',
  nextTick: 'nextTick',
  
  // 组件通信
  provide: 'provide',
  inject: 'inject',
  
  // 模板引用
  templateRef: 'templateRef',
  getCurrentInstance: 'getCurrentInstance'
} as const

/**
 * Vue 指令映射
 */
export const VUE_DIRECTIVE_MAP = {
  'v-if': 'wx:if',
  'v-else-if': 'wx:elif',
  'v-else': 'wx:else',
  'v-for': 'wx:for',
  'v-show': 'hidden',
  'v-model': 'model:value',
  '@click': 'bindtap',
  '@tap': 'bindtap',
  '@input': 'bindinput',
  '@change': 'bindchange',
  '@focus': 'bindfocus',
  '@blur': 'bindblur',
  '@submit': 'bindsubmit',
  '@reset': 'bindreset',
  '@touchstart': 'bindtouchstart',
  '@touchmove': 'bindtouchmove',
  '@touchend': 'bindtouchend',
  '@touchcancel': 'bindtouchcancel',
  '@longtap': 'bindlongtap',
  '@longpress': 'bindlongpress'
} as const

/**
 * Vue 生命周期到小程序生命周期映射
 */
export const LIFECYCLE_MAP = {
  // 组件生命周期
  onBeforeMount: 'created',
  onMounted: 'attached',
  onBeforeUpdate: 'beforeUpdate',
  onUpdated: 'updated',
  onBeforeUnmount: 'detached',
  onUnmounted: 'detached',
  onActivated: 'pageLifetimes.show',
  onDeactivated: 'pageLifetimes.hide',
  
  // 页面生命周期
  onLoad: 'onLoad',
  onShow: 'onShow',
  onReady: 'onReady',
  onHide: 'onHide',
  onUnload: 'onUnload',
  onPullDownRefresh: 'onPullDownRefresh',
  onReachBottom: 'onReachBottom',
  onShareAppMessage: 'onShareAppMessage',
  onPageScroll: 'onPageScroll',
  onResize: 'onResize',
  onTabItemTap: 'onTabItemTap'
} as const

/**
 * Props 类型定义
 */
export interface PropDefinition {
  type: string
  default?: any
  required?: boolean
  validator?: Function
}

/**
 * Emit 事件定义
 */
export interface EmitDefinition {
  name: string
  payload?: any[]
}

/**
 * 计算属性定义
 */
export interface ComputedDefinition {
  getter: string
  setter?: string
  dependencies: string[]
}

/**
 * 监听器定义
 */
export interface WatchDefinition {
  source: string
  callback: string
  options: {
    immediate?: boolean
    deep?: boolean
    flush?: 'pre' | 'post' | 'sync'
  }
}

/**
 * 响应式数据定义
 */
export interface ReactiveDefinition {
  type: 'ref' | 'reactive' | 'computed'
  value: any
  reactive: boolean
}

/**
 * 组件选项
 */
export interface ComponentOptions {
  name?: string
  props?: Record<string, PropDefinition>
  emits?: EmitDefinition[]
  data?: Record<string, any>
  computed?: Record<string, ComputedDefinition>
  watch?: Record<string, WatchDefinition>
  methods?: Record<string, Function>
  lifecycle?: Record<string, string>
  components?: Record<string, string>
  expose?: string[]
}
