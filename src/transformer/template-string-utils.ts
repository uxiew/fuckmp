/**
 * 模板字符串后处理工具。
 *
 * 这些函数只处理 WXML 字符串，不依赖 TemplateTransformer 实例状态。
 */
import { logger } from '@/utils/index.js'
import { VUE_DIRECTIVE_MAP } from '@/types/index.js'

/**
 * Template AST 指令转换所需的最小字段。
 */
export interface TemplateDirectiveLike {
  /** 指令表达式，例如 `foo in list` 或 `form.name` */
  expression?: string
  /** 指令参数，例如 `click` */
  arg?: string
  /** 指令修饰符，例如 `capture`、`number`、`trim` */
  modifiers?: string[]
}

/**
 * 转换 Vue/HTML 标签名为微信小程序标签名。
 */
export function transformTemplateTag(tag: string): string {
  const tagMap: Record<string, string> = {
    div: 'view',
    span: 'text',
    p: 'text',
    img: 'image',
    a: 'navigator',
    ul: 'view',
    li: 'view',
    button: 'button',
    input: 'input',
    textarea: 'textarea',
    select: 'picker',
    option: 'picker-view-column'
  }

  return tagMap[tag] || tag
}

/**
 * 转换 AST `v-model` 指令为小程序属性与输入事件。
 */
export function transformVModelDirective(directive: TemplateDirectiveLike): Record<string, any> {
  const expression = directive.expression || 'modelValue'
  const modifiers = directive.modifiers || []

  let inputHandler = '_handleInput'
  if (modifiers.includes('number')) {
    inputHandler = '_handleNumberInput'
  } else if (modifiers.includes('trim')) {
    inputHandler = '_handleTrimInput'
  }

  return {
    value: `{{${expression}}}`,
    bindinput: `${inputHandler}_${expression.replace(/\./g, '_')}`
  }
}

/**
 * 转换 AST `v-for` 指令为小程序列表渲染属性。
 */
export function transformVForDirective(directive: TemplateDirectiveLike): Record<string, any> {
  const expression = directive.expression
  if (!expression) {
    return {}
  }

  const match = expression.match(/(\w+)(?:\s*,\s*(\w+))?\s+in\s+(.+)/)

  if (match) {
    const [, item, index, list] = match
    return {
      'wx:for': `{{${list}}}`,
      'wx:for-item': item,
      'wx:for-index': index || 'index',
      'wx:key': item
    }
  }

  return {}
}

/**
 * 转换 AST `v-on` 指令为小程序事件绑定。
 */
export function transformVOnDirective(directive: TemplateDirectiveLike): Record<string, any> {
  const eventName = directive.arg
  const handler = directive.expression
  const modifiers = directive.modifiers || []

  const eventMap: Record<string, string> = {
    click: 'tap',
    input: 'input',
    change: 'change',
    focus: 'focus',
    blur: 'blur',
    submit: 'submit',
    touchstart: 'touchstart',
    touchmove: 'touchmove',
    touchend: 'touchend'
  }

  const mappedEvent = eventName ? eventMap[eventName] || eventName : ''
  const bindType = modifiers.includes('capture') ? 'capture-bind:' : 'bind:'

  return {
    [`${bindType}${mappedEvent}`]: handler
  }
}

/**
 * 验证模板转换得到的 WXML 结果。
 */
export function validateWxmlTransformResult(result: { wxml: string }): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!result.wxml.trim()) {
    errors.push('生成的 WXML 为空')
  }

  const openTags = result.wxml.match(/<(\w+)(?:\s[^>]*)?>/g) || []
  const closeTags = result.wxml.match(/<\/(\w+)>/g) || []

  if (openTags.length !== closeTags.length) {
    errors.push('WXML 标签未正确闭合')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * 转换 Vue 属性绑定语法。
 */
export function transformVueBindings(wxml: string): string {
  // 特殊处理动态类绑定：合并静态 class 和动态 :class
  wxml = transformDynamicClassBinding(wxml)

  // 处理 :prop="value" -> prop="{{value}}" (排除已处理的 class)
  wxml = wxml.replace(/:([a-zA-Z-]+)="([^"]*)"/g, (match, prop, value) => {
    if (prop === 'class') {
      // class 已经在 transformDynamicClassBinding 中处理
      return match
    }
    // 如果值已经包含花括号，不要重复添加
    const finalValue = value.includes('{{') ? value : `{{${value}}}`
    logger.debug(`转换属性绑定: :${prop}="${value}" -> ${prop}="${finalValue}"`)
    return `${prop}="${finalValue}"`
  })

  // 处理 v-bind:prop="value" -> prop="{{value}}"
  wxml = wxml.replace(/v-bind:([a-zA-Z-]+)="([^"]*)"/g, (match, prop, value) => {
    if (prop === 'class') {
      // class 已经在 transformDynamicClassBinding 中处理
      return match
    }
    const finalValue = value.includes('{{') ? value : `{{${value}}}`
    logger.debug(`转换 v-bind: v-bind:${prop}="${value}" -> ${prop}="${finalValue}"`)
    return `${prop}="${finalValue}"`
  })

  return wxml
}

/**
 * 转换动态类绑定。
 *
 * 处理同时存在 `class="static"` 和 `:class="dynamic"` 的情况。
 */
export function transformDynamicClassBinding(wxml: string): string {
  // 匹配同时包含静态 class 和动态 :class 的标签
  // 修复正则表达式，允许 class 和 :class 相邻或有其他属性分隔
  const classBindingRegex = /<([a-zA-Z-]+)([^>]*?)\sclass="([^"]*)"([^>]*?):class="([^"]*)"([^>]*)>/g

  wxml = wxml.replace(classBindingRegex, (_match, tagName, beforeClass, staticClass, betweenClass, dynamicClass, afterClass) => {
    logger.debug(`处理动态类绑定: 标签=${tagName}, 静态="${staticClass}", 动态="${dynamicClass}"`)

    const dynamicClassExpression = buildDynamicClassExpression(dynamicClass)
    const combinedClassExpression = staticClass
      ? `'${staticClass}' + ' ' + (${dynamicClassExpression})`
      : dynamicClassExpression

    // 移除 :class 属性，只保留合并后的 class
    const cleanedAfterClass = afterClass.replace(/:class="[^"]*"/, '').trim()
    const result = `<${tagName}${beforeClass} class="{{${combinedClassExpression}}}"${betweenClass}${cleanedAfterClass}>`
    logger.debug(`动态类绑定转换结果: ${result}`)

    return result
  })

  // 处理只有 :class 没有静态 class 的情况
  const dynamicOnlyRegex = /:class="([^"]*)"/g
  wxml = wxml.replace(dynamicOnlyRegex, (_match, dynamicClass) => {
    logger.debug(`处理纯动态类绑定: "${dynamicClass}"`)
    return `class="{{${buildDynamicClassExpression(dynamicClass)}}}"`
  })

  return wxml
}

/**
 * 转换 Vue 事件绑定语法。
 */
export function transformVueEvents(wxml: string): string {
  // 处理 @event.modifier="handler" -> bind:event="handler" (忽略修饰符)
  wxml = wxml.replace(/@([a-zA-Z-]+)(?:\.[a-zA-Z]+)*="([^"]*)"/g, (match, event, handler) => {
    // 事件名映射
    const eventMap: Record<string, string> = {
      click: 'tap',
      'user-click': 'user-click', // 自定义事件保持原名
      'send-message': 'send-message'
    }

    const mappedEvent = eventMap[event] || event
    logger.debug(`转换事件绑定: ${match} -> bind:${mappedEvent}="${handler}"`)

    return `bind:${mappedEvent}="${handler}"`
  })

  // 处理 v-on:event.modifier="handler" -> bind:event="handler"
  wxml = wxml.replace(/v-on:([a-zA-Z-]+)(?:\.[a-zA-Z]+)*="([^"]*)"/g, (match, event, handler) => {
    const eventMap: Record<string, string> = {
      click: 'tap'
    }

    const mappedEvent = eventMap[event] || event
    logger.debug(`转换 v-on: ${match} -> bind:${mappedEvent}="${handler}"`)

    return `bind:${mappedEvent}="${handler}"`
  })

  return wxml
}

/**
 * 执行标准 fallback 字符串模板转换管线。
 */
export function transformBasicTemplateSyntax(template: string): string {
  let wxml = template

  wxml = transformVueBindings(wxml)
  wxml = transformVueEvents(wxml)
  wxml = transformVModelDirectives(wxml)
  wxml = transformVForDirectives(wxml)
  wxml = transformBasicDirectives(wxml)
  wxml = transformBasicTags(wxml)
  wxml = fixSelfClosingTags(wxml)
  wxml = fixTripleBraces(wxml)
  wxml = cleanupWhitespace(wxml)

  return wxml
}

/**
 * 转换基础 Vue 指令名称为小程序指令。
 */
function transformBasicDirectives(wxml: string): string {
  Object.entries(VUE_DIRECTIVE_MAP).forEach(([vueDirective, wxDirective]) => {
    const regex = new RegExp(`\\s${vueDirective}=`, 'g')
    wxml = wxml.replace(regex, ` ${wxDirective}=`)
  })

  return wxml
}

/**
 * 转换基础 Vue/HTML 标签为小程序标签。
 */
function transformBasicTags(wxml: string): string {
  const tagReplacements = [
    ['<div', '<view'],
    ['</div>', '</view>'],
    ['<span', '<text'],
    ['</span>', '</text>'],
    ['<img', '<image'],
    ['<p', '<text'],
    ['</p>', '</text>']
  ]

  tagReplacements.forEach(([from, to]) => {
    wxml = wxml.replace(new RegExp(from as string, 'g'), to as string)
  })

  return wxml
}

/**
 * 转换 v-model 字符串指令。
 */
function transformVModelDirectives(wxml: string): string {
  return wxml.replace(/v-model="([^"]+)"/g, (_match, expression) => {
    return `value="{{${expression}}}" bindinput="_handleInput_${expression.replace(/\./g, '_')}"`
  })
}

/**
 * 转换 v-for 字符串指令。
 */
function transformVForDirectives(wxml: string): string {
  return wxml.replace(/v-for="(\w+)(?:\s*,\s*(\w+))?\s+in\s+([^"]+)"/g, (_match, item, index, list) => {
    return `wx:for="{{${list}}}" wx:for-item="${item}" wx:for-index="${index || 'index'}" wx:key="${item}"`
  })
}

/**
 * 修复自闭合标签语法。
 */
export function fixSelfClosingTags(wxml: string): string {
  // 修复错误的自闭合标签语法，如 <image src="..." / attr> -> <image src="..." attr />
  wxml = wxml.replace(/(<[^>]+)\s\/\s([^>]*>)/g, '$1 $2')

  // 确保自闭合标签正确闭合
  const selfClosingTags = ['image', 'input', 'icon', 'progress', 'slider', 'switch']
  selfClosingTags.forEach(tag => {
    // 修复未正确闭合的自闭合标签
    const regex = new RegExp(`<${tag}([^>]*[^/])>`, 'g')
    wxml = wxml.replace(regex, `<${tag}$1 />`)
  })

  return wxml
}

/**
 * 修复三重花括号问题。
 */
export function fixTripleBraces(wxml: string): string {
  return wxml.replace(/\{\{\{([^}]+)\}\}\}/g, '{{$1}}')
}

/**
 * 清理多余的空格和换行。
 */
export function cleanupWhitespace(wxml: string): string {
  return wxml
    .replace(/\n\s*/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

/**
 * 转换为 kebab-case。
 */
export function toKebabCase(str: string): string {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '')
}

/**
 * 合并静态 class 与动态 class 表达式。
 */
export function buildClassBindingExpression(staticClass: string, dynamicClass: string): string {
  if (dynamicClass) {
    const dynamicClassExpression = buildDynamicClassExpression(dynamicClass)
    return staticClass ? `'${staticClass}' + ' ' + (${dynamicClassExpression})` : dynamicClassExpression
  }

  return staticClass ? `'${staticClass}'` : ''
}

/**
 * 根据 Vue `:class` 内容生成 WXML 表达式片段。
 */
function buildDynamicClassExpression(dynamicClass: string): string {
  // 处理对象语法：{ online: isOnline, active: isActive }
  if (dynamicClass.trim().startsWith('{') && dynamicClass.trim().endsWith('}')) {
    const objectContent = dynamicClass.trim().slice(1, -1)
    const classConditions = objectContent.split(',').map((condition: string) => {
      const [className, expression] = condition.split(':').map((s: string) => s.trim())
      const cleanClassName = (className || '').replace(/['"]/g, '')
      const cleanExpression = (expression || '').trim()
      return `${cleanExpression} ? '${cleanClassName}' : ''`
    }).filter((condition: string) => !condition.includes("'' ? '' : ''"))

    if (classConditions.length === 1) {
      return classConditions[0] || ''
    }
    if (classConditions.length > 1) {
      return `(${classConditions.join(' + " " + ')})`
    }
    return ''
  }

  // 处理数组语法或简单表达式
  return dynamicClass
}
