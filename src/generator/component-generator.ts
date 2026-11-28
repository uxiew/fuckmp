/**
 * 组件代码生成器
 */

import type { TransformContext, GenerateResult, CompilerOptions } from '@/types/index.js'
import type { ScriptTransformResult, TemplateTransformResult, StyleTransformResult } from '@/transformer/index.js'
import { generateDefineExposeDegradeComment, generateDefineOptionsDegradeComment, generateDefineSlotsDegradeComment, generateProvideInjectDegradeComment, generateUseIdCounterDeclaration, generateUseIdNativeComment, generateUseTemplateRefDegradeComment, generateUnsupportedTemplateDegradeComment, generateWatcherDegradeComment, logger } from '@/utils/index.js'
import { generateComponentMethods } from './component-method-generator-utils.js'
import { addScopeAttributes, generateScopeId, generateUsingComponents, removeCtxPrefixes, needsWxsHelpers, injectWxsHelpersImport } from './shared-generator-utils.js'

/**
 * 组件生成器类
 */
export class ComponentGenerator {
  private options: CompilerOptions['injection']

  constructor(options: CompilerOptions['injection']) {
    this.options = options
  }

  /**
   * 生成组件代码
   */
  async generateComponent(
    scriptResult: ScriptTransformResult | undefined,
    templateResult: TemplateTransformResult,
    styleResults: StyleTransformResult | StyleTransformResult[],
    context: TransformContext
  ): Promise<GenerateResult> {
    try {
      logger.debug(`生成组件代码: ${context.filename}`)

      const result: GenerateResult = {
        js: this.generateJS(scriptResult?.context ?? context, templateResult, context),
        json: this.generateJSON(templateResult, context),
        wxml: this.generateWXML(templateResult, context),
        wxss: this.generateWXSS(styleResults, context)
      }

      logger.debug(`组件代码生成完成: ${context.filename}`)
      return result

    } catch (error) {
      logger.error(`组件代码生成失败: ${context.filename}`, error as Error)
      throw error
    }
  }

  /**
   * 生成 JavaScript 代码
   */
  private generateJS(transformContext: TransformContext, templateResult: TemplateTransformResult, context: TransformContext): string {
    const { props, emits, data, methods, computed, lifecycle } = transformContext

    logger.debug(`生成组件 JS，数据统计:`, {
      props: Object.keys(props).length,
      emits: emits.length,
      data: Object.keys(data).length,
      methods: Object.keys(methods).length,
      computed: Object.keys(computed).length,
      lifecycle: Object.keys(lifecycle).length
    })

    // 生成组件定义
    const componentCode = `${generateDefineExposeDegradeComment(transformContext.expose, '组件')}${generateDefineOptionsDegradeComment(transformContext.defineOptions || {}, '组件')}${generateDefineSlotsDegradeComment(transformContext.defineSlots || {}, '组件')}${generateWatcherDegradeComment(transformContext.watcherEffects || {}, '组件')}${generateUseTemplateRefDegradeComment(transformContext.templateRefs || {}, '组件')}${generateUseIdNativeComment(transformContext.useIds || {}, '组件')}${generateProvideInjectDegradeComment(transformContext.provideInject || {}, '组件')}${generateUnsupportedTemplateDegradeComment(transformContext.templateUnsupported || {}, '组件')}${generateUseIdCounterDeclaration(transformContext.useIds || {})}Component({
${this.hasSlots(templateResult) ? '  // 组件选项\n  options: { multipleSlots: true },\n\n' : ''}  // 组件属性定义
  properties: ${this.generateProperties(props)},

  // 组件数据
  data: ${JSON.stringify(data, null, 2)},

  // 生命周期函数
  lifetimes: {
${this.generateLifetimes(lifecycle)}
  },

  // 页面生命周期函数
  pageLifetimes: {
${this.generatePageLifetimes(lifecycle)}
  },

  // 组件方法
  methods: {
${generateComponentMethods({ methods, computed, emits, context: transformContext, templateResult })}
  }
})`

    return this.addHeader(componentCode, context)
  }

  /**
   * 生成 JSON 配置
   */
  private generateJSON(
    templateResult: TemplateTransformResult,
    context: TransformContext
  ): Record<string, any> {
    const hasSlots = this.hasSlots(templateResult)

    const config: any = {
      component: true,
      usingComponents: generateUsingComponents(context.components, {
        debugLabel: '组件引用',
        errorLabel: '处理组件路径失败'
      }),
      // 有 slot 的组件使用 apply-shared，让父页面样式可以应用到 slot 内容
      styleIsolation: hasSlots ? 'apply-shared' : 'isolated'
    }

    return config
  }

  /**
   * 生成 WXML 模板
   */
  private generateWXML(templateResult: TemplateTransformResult, context: TransformContext): string {
    let wxml = templateResult.wxml

    // 移除所有的 _ctx. 前缀（后处理步骤）
    wxml = removeCtxPrefixes(wxml)

    // 只有在使用了 scoped 样式时才添加作用域属性
    if (context.hasScoped && context.filename) {
      const scopeId = generateScopeId(context.filename)
      wxml = addScopeAttributes(wxml, scopeId)
    }

    // 如果 WXML 中使用了 WXS 辅助函数，注入引用
    if (needsWxsHelpers(wxml)) {
      // 组件在 components/ 目录下，helpers.wxs 在根目录
      wxml = injectWxsHelpersImport(wxml, '../helpers.wxs')
    }

    return wxml
  }

  /**
   * 生成 WXSS 样式
   */
  private generateWXSS(styleResults: StyleTransformResult | StyleTransformResult[], context: TransformContext): string {
    if (!styleResults) {
      return ''
    }

    // 如果是单个样式结果，直接返回
    if (!Array.isArray(styleResults)) {
      return styleResults.wxss
    }

    // 如果是多个样式结果，合并它们
    const allStyles = styleResults
      .filter(result => result && result.wxss)
      .map(result => result.wxss)
      .join('\n\n')

    return allStyles
  }

  /**
   * 生成属性定义
   */
  private generateProperties(props: Record<string, any>): string {
    if (Object.keys(props).length === 0) {
      return '{}'
    }

    const entries = Object.entries(props).map(([key, prop]) => {
      const type = this.getPropertyType(prop)
      const value = this.getPropertyDefault(prop)

      return `    ${key}: {
      type: ${type},
      value: ${JSON.stringify(value)}
    }`
    })

    return `{
${entries.join(',\n')}
  }`
  }

  /**
   * 生成生命周期函数
   */
  private generateLifetimes(lifecycle: Record<string, string>): string {
    const lifetimes = ['created', 'attached', 'ready', 'moved', 'detached', 'error']
    const entries: string[] = []

    lifetimes.forEach(lifetime => {
      const code = lifecycle[lifetime]
      if (code && code.trim()) {
        entries.push(`    ${lifetime}() {
      this._setupReactivity()
      ${code.trim()}
    }`)
      }
    })

    return entries.join(',\n\n')
  }

  /**
   * 生成页面生命周期函数
   */
  private generatePageLifetimes(lifecycle: Record<string, string>): string {
    const pageLifetimes = ['show', 'hide', 'resize']
    const entries: string[] = []

    pageLifetimes.forEach(lifetime => {
      const code = lifecycle[`pageLifetimes.${lifetime}`]
      if (code && code.trim()) {
        entries.push(`    ${lifetime}() {
      ${code.trim()}
    }`)
      }
    })

    return entries.join(',\n\n')
  }

  /**
   * 检查是否有插槽
   */
  private hasSlots(templateResult: TemplateTransformResult): boolean {
    return templateResult.wxml.includes('<slot')
  }

  /**
   * 获取属性类型
   */
  private getPropertyType(prop: any): string {
    const propType = prop && typeof prop === 'object' && 'type' in prop ? prop.type : prop
    if (typeof propType === 'function') {
      if (propType === String) return 'String'
      if (propType === Number) return 'Number'
      if (propType === Boolean) return 'Boolean'
      if (propType === Array) return 'Array'
      if (propType === Object) return 'Object'
    }
    return 'String'
  }

  /**
   * 获取属性默认值
   */
  private getPropertyDefault(prop: any): any {
    if (prop && typeof prop === 'object' && 'default' in prop && prop.default !== undefined) {
      return prop.default
    }

    const propType = prop && typeof prop === 'object' && 'type' in prop ? prop.type : prop
    if (typeof propType === 'function') {
      if (propType === String) return ''
      if (propType === Number) return 0
      if (propType === Boolean) return false
      if (propType === Array) return []
      if (propType === Object) return {}
    }
    return null
  }

  /**
   * 添加文件头部注释
   */
  private addHeader(code: string, context: TransformContext): string {
    return `// 由 Vue3 微信小程序编译器自动生成
// 源文件: ${context.filename}
// 生成时间: ${new Date().toISOString()}

${code}`
  }

}
