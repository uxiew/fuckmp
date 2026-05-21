import { describe, expect, it } from 'vitest'
import { SFCParser } from '@/parser/sfc-parser'
import { DEFAULT_COMPILER_OPTIONS } from '@/compiler/options'

const parser = new SFCParser(DEFAULT_COMPILER_OPTIONS)

describe('SFCParser latest Vue 3 compatibility', () => {
  it('编译 Vue 3.5 script setup 宏与响应式 props 解构', async () => {
    const source = `
<template>
  <view>{{ label }}: {{ count }}</view>
</template>
<script setup lang="ts">
interface Props {
  label?: string
  count?: number
}

const { label = '默认标题', count = 0 } = defineProps<Props>()
const emit = defineEmits<{
  save: [value: number]
}>()
const model = defineModel<string>({ default: 'hello' })
const namedModel = defineModel<number>('count', { default: 0 })

defineExpose({
  focus: () => emit('save', count)
})
</script>
`

    const parsed = await parser.parseSFC(source, 'LatestVueMacros.vue')
    const compiled = await parser.compileScriptSetup(parsed.descriptor)

    expect(compiled).not.toBeNull()
    expect(compiled?.content).toContain('props:')
    expect(compiled?.content).toContain('emits:')
    expect(compiled?.content).toContain('update:modelValue')
    expect(compiled?.content).toContain('update:count')
    expect(compiled?.content).toContain('__expose')
    expect(compiled?.content).toContain('default: \'默认标题\'')
    expect(compiled?.bindings.label).toBe('props')
    expect(compiled?.bindings.count).toBe('props')
    expect(compiled?.bindings.model).toBe('setup-ref')
    expect(compiled?.bindings.namedModel).toBe('setup-ref')
  })
})
