import type { Vue3FeatureUsage } from './runtime-injector.js'

/**
 * 创建一个完整、未使用任何 Vue3 特性的运行时 usage 状态。
 */
export function createEmptyFeatureUsage(): Vue3FeatureUsage {
  return {
    reactivity: {
      ref: false,
      reactive: false,
      computed: false,
      watch: false,
      watchEffect: false
    },
    composition: {
      setup: false,
      defineProps: false,
      defineEmits: false,
      defineExpose: false,
      provide: false,
      inject: false
    },
    directives: {
      vIf: false,
      vFor: false,
      vModel: false,
      vShow: false,
      vOn: false,
      vBind: false
    },
    lifecycle: {
      onMounted: false,
      onUnmounted: false,
      onUpdated: false,
      onBeforeMount: false,
      onBeforeUnmount: false,
      onBeforeUpdate: false
    },
    advanced: {
      slots: false,
      teleport: false,
      suspense: false,
      keepAlive: false,
      transition: false
    }
  }
}

/**
 * 将单个源码内容中出现的 Vue3 能力标记合并到 usage 状态。
 */
export function analyzeFeatureUsageFromContent(content: string, usage: Vue3FeatureUsage): void {
  // 分析响应式API
  if (content.includes('ref(')) usage.reactivity.ref = true
  if (content.includes('reactive(')) usage.reactivity.reactive = true
  if (content.includes('computed(')) usage.reactivity.computed = true
  if (content.includes('watch(')) usage.reactivity.watch = true
  if (content.includes('watchEffect(')) usage.reactivity.watchEffect = true

  // 分析组合式API
  if (content.includes('<script setup>') || content.includes('<script lang="ts" setup>')) {
    usage.composition.setup = true
  }
  if (content.includes('defineProps')) usage.composition.defineProps = true
  if (content.includes('defineEmits')) usage.composition.defineEmits = true
  if (content.includes('defineExpose')) usage.composition.defineExpose = true
  if (content.includes('provide(')) usage.composition.provide = true
  if (content.includes('inject(')) usage.composition.inject = true

  // 分析模板指令
  if (content.includes('v-if') || content.includes('v-else')) usage.directives.vIf = true
  if (content.includes('v-for')) usage.directives.vFor = true
  if (content.includes('v-model')) usage.directives.vModel = true
  if (content.includes('v-show')) usage.directives.vShow = true
  if (content.includes('@') || content.includes('v-on:')) usage.directives.vOn = true
  if (content.includes(':') || content.includes('v-bind:')) usage.directives.vBind = true

  // 分析生命周期钩子
  if (content.includes('onMounted')) usage.lifecycle.onMounted = true
  if (content.includes('onUnmounted')) usage.lifecycle.onUnmounted = true
  if (content.includes('onUpdated')) usage.lifecycle.onUpdated = true
  if (content.includes('onBeforeMount')) usage.lifecycle.onBeforeMount = true
  if (content.includes('onBeforeUnmount')) usage.lifecycle.onBeforeUnmount = true
  if (content.includes('onBeforeUpdate')) usage.lifecycle.onBeforeUpdate = true

  // 分析高级特性
  if (content.includes('<slot') || content.includes('useSlots')) usage.advanced.slots = true
  if (content.includes('<teleport')) usage.advanced.teleport = true
  if (content.includes('<suspense')) usage.advanced.suspense = true
  if (content.includes('<keep-alive')) usage.advanced.keepAlive = true
  if (content.includes('<transition')) usage.advanced.transition = true
}

/**
 * 将 source 中已识别的特性按布尔 OR 语义合并到 target。
 *
 * @returns 原始 target，便于链式或断言目标对象未被替换。
 */
export function mergeFeatureUsage(
  target: Vue3FeatureUsage,
  source: Vue3FeatureUsage
): Vue3FeatureUsage {
  Object.entries(source).forEach(([categoryName, categoryUsage]) => {
    const targetCategory = target[categoryName as keyof Vue3FeatureUsage]
    Object.entries(categoryUsage).forEach(([featureName, used]) => {
      if (used) {
        ;(targetCategory as Record<string, boolean>)[featureName] = true
      }
    })
  })

  return target
}

/**
 * 统计 usage 状态中已经启用的 Vue3 特性数量。
 */
export function countUsedRuntimeFeatures(usage: Vue3FeatureUsage): number {
  let count = 0
  Object.values(usage).forEach(category => {
    Object.values(category).forEach(used => {
      if (used) count++
    })
  })
  return count
}
