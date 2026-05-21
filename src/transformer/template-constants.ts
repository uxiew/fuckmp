/**
 * Vue 模板到微信小程序模板的基础映射表。
 */

/**
 * Vue 指令到小程序指令的映射。
 */
export const DIRECTIVE_MAP = {
  'v-if': 'wx:if',
  'v-else-if': 'wx:elif',
  'v-else': 'wx:else',
  'v-show': 'hidden',
  'v-for': 'wx:for',
  'v-model': 'model:value'
} as const

/**
 * HTML 标签到小程序标签的映射。
 */
export const TAG_MAP = {
  'div': 'view',
  'span': 'text',
  'p': 'text',
  'img': 'image',
  'a': 'navigator',
  'input': 'input',
  'textarea': 'textarea',
  'button': 'button',
  'form': 'form'
} as const

/**
 * 事件名映射。
 */
export const EVENT_MAP = {
  'click': 'tap',
  'input': 'input',
  'change': 'change',
  'focus': 'focus',
  'blur': 'blur',
  'submit': 'submit',
  'touchstart': 'touchstart',
  'touchmove': 'touchmove',
  'touchend': 'touchend'
} as const
