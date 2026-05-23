import { describe, expect, it } from 'vitest'
import type { Vue3FeatureUsage } from '@/compiler/runtime-injector.js'
import {
  analyzeFeatureUsageFromContent,
  countUsedRuntimeFeatures,
  createEmptyFeatureUsage,
  mergeFeatureUsage
} from '@/compiler/runtime-injector-usage-utils.js'

describe('runtime injector usage utils', () => {
  it('创建完整的默认特性使用状态', () => {
    const usage = createEmptyFeatureUsage()

    expect(usage).toEqual({
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
    })
  })

  it('从源码内容识别 runtime 注入所需特性', () => {
    const usage = createEmptyFeatureUsage()

    analyzeFeatureUsageFromContent(`
      <template>
        <transition>
          <slot name="default" />
        </transition>
        <div v-if="visible" v-for="item in items" :key="item.id" v-show="visible">
          <input v-model="item.name" @input="onInput" v-bind:title="item.name" />
        </div>
        <teleport to="body"><view /></teleport>
        <suspense><view /></suspense>
        <keep-alive><Child /></keep-alive>
      </template>
      <script lang="ts" setup>
      import { computed, inject, onBeforeMount, onBeforeUnmount, onBeforeUpdate, onMounted, onUnmounted, onUpdated, provide, reactive, ref, watch, watchEffect } from 'vue'
      const props = defineProps<{ title: string }>()
      const emit = defineEmits<{ close: [] }>()
      defineExpose({ focus: () => undefined })
      const state = reactive({ count: 0 })
      const count = ref(0)
      const doubled = computed(() => count.value * 2)
      watch(count, () => undefined)
      watchEffect(() => state.count)
      provide('theme', 'dark')
      inject('theme')
      onBeforeMount(() => undefined)
      onMounted(() => undefined)
      onUpdated(() => undefined)
      onBeforeUpdate(() => undefined)
      onBeforeUnmount(() => undefined)
      onUnmounted(() => undefined)
      props.title
      emit('close')
      </script>
    `, usage)

    expect(usage.reactivity).toEqual({
      ref: true,
      reactive: true,
      computed: true,
      watch: true,
      watchEffect: true
    })
    expect(usage.composition).toEqual({
      setup: true,
      defineProps: true,
      defineEmits: true,
      defineExpose: true,
      provide: true,
      inject: true
    })
    expect(usage.directives).toEqual({
      vIf: true,
      vFor: true,
      vModel: true,
      vShow: true,
      vOn: true,
      vBind: true
    })
    expect(usage.lifecycle).toEqual({
      onMounted: true,
      onUnmounted: true,
      onUpdated: true,
      onBeforeMount: true,
      onBeforeUnmount: true,
      onBeforeUpdate: true
    })
    expect(usage.advanced).toEqual({
      slots: true,
      teleport: true,
      suspense: true,
      keepAlive: true,
      transition: true
    })
  })

  it('合并多个文件的特性状态并统计已使用数量', () => {
    const target = createEmptyFeatureUsage()
    const patch: Vue3FeatureUsage = createEmptyFeatureUsage()
    target.reactivity.ref = true
    target.composition.setup = true
    patch.directives.vIf = true
    patch.advanced.slots = true

    const merged = mergeFeatureUsage(target, patch)

    expect(merged).toBe(target)
    expect(merged.reactivity.ref).toBe(true)
    expect(merged.composition.setup).toBe(true)
    expect(merged.directives.vIf).toBe(true)
    expect(merged.advanced.slots).toBe(true)
    expect(countUsedRuntimeFeatures(merged)).toBe(4)
  })
})
