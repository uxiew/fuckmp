import { describe, expect, it } from 'vitest'
import { createScriptTransformContext } from '@/transformer/script-transformer-utils.js'
import {
  extractVueTemplateExpression,
  isVueTemplateSelfClosingTag,
  resolveVueTemplateForKeyExpression,
  transformVueTemplateInterpolationNode,
  transformVueTemplateTextNode
} from '@/transformer/vue-template-node-utils.js'

describe('vue-template-node-utils', () => {
  it('提取表达式并移除 _ctx 前缀，同时应用 props 别名映射', () => {
    const context = createScriptTransformContext('components/card.vue', false)
    context.propAliases?.set('displayTitle', 'title')

    expect(extractVueTemplateExpression('_ctx.count', context)).toBe('count')
    expect(extractVueTemplateExpression({ content: '_ctx.displayTitle' }, context)).toBe('title')
    expect(extractVueTemplateExpression({ loc: { source: 'displayTitle + count' } }, context)).toBe('title + count')
  })

  it('转换文本和插值节点', () => {
    const context = createScriptTransformContext('components/card.vue', false)
    context.propAliases?.set('displayTitle', 'title')

    expect(transformVueTemplateTextNode({ content: 'hello' })).toBe('hello')
    expect(transformVueTemplateInterpolationNode({ content: { type: 4, content: '_ctx.count' } }, context)).toBe('{{count}}')
    expect(transformVueTemplateInterpolationNode({
      content: {
        type: 8,
        loc: { source: 'displayTitle + count' },
        children: []
      }
    }, context)).toBe('{{title + count}}')
  })

  it('从 v-for 首个子节点的 :key 推断 wx:key', () => {
    const context = createScriptTransformContext('components/list.vue', false)

    expect(resolveVueTemplateForKeyExpression({ children: [] }, 'item', context)).toBeUndefined()
    expect(resolveVueTemplateForKeyExpression({
      children: [{
        props: [{
          type: 7,
          name: 'bind',
          arg: { content: 'key' },
          exp: { content: 'item.id' }
        }]
      }]
    }, 'item', context)).toBe('id')
    expect(resolveVueTemplateForKeyExpression({
      children: [{
        props: [{
          type: 7,
          name: 'bind',
          arg: { content: 'key' },
          exp: { content: 'user.profile.id' }
        }]
      }]
    }, 'item', context)).toBeUndefined()
    expect(context.templateUnsupported?.capabilities).toContain('non-native v-for key')
  })

  it('仅在白名单标签且无子内容时判定为自闭合', () => {
    expect(isVueTemplateSelfClosingTag('input', '')).toBe(true)
    expect(isVueTemplateSelfClosingTag('image', '   ')).toBe(true)
    expect(isVueTemplateSelfClosingTag('input', '<text>child</text>')).toBe(false)
    expect(isVueTemplateSelfClosingTag('view', '')).toBe(false)
  })
})
