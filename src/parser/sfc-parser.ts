/**
 * Vue SFC 解析器
 */

import { parse as vueParse, compileScript } from '@vue/compiler-sfc'
import type { SFCDescriptor, SFCScriptBlock, SFCTemplateBlock, SFCStyleBlock } from '@vue/compiler-sfc'
import type { ParseResult, CompilerOptions } from '@/types/index.js'
import { logger } from '@/utils/index.js'

/**
 * Vue SFC 解析器类
 */
export class SFCParser {
  private options: CompilerOptions

  constructor(options: CompilerOptions) {
    this.options = options
  }

  /**
   * 解析 Vue SFC 文件
   */
  async parseSFC(content: string, filename: string): Promise<ParseResult> {
    try {
      logger.debug(`解析 SFC 文件: ${filename}`)

      // 使用 Vue 官方解析器解析 SFC
      const { descriptor, errors } = vueParse(content, {
        filename,
        sourceMap: this.options.optimization.sourcemap
      })

      if (errors.length > 0) {
        const errorMessage = errors.map(e => e.message).join(', ')
        throw new Error(`SFC 解析错误: ${errorMessage}`)
      }

      // 构建解析结果
      const result: ParseResult = {
        filename,
        descriptor,
        template: this.parseTemplate(descriptor.template),
        script: this.parseScript(descriptor.script, descriptor.scriptSetup),
        styles: this.parseStyles(descriptor.styles),
        customBlocks: this.parseCustomBlocks(descriptor.customBlocks)
      }

      logger.debug(`SFC 解析完成: ${filename}`)
      return result

    } catch (error) {
      logger.error(`SFC 解析失败: ${filename}`, error as Error)
      throw error
    }
  }

  /**
   * 解析模板部分
   */
  private parseTemplate(template: SFCTemplateBlock | null): ParseResult['template'] {
    if (!template) return undefined

    return {
      content: template.content,
      lang: template.lang || 'html',
      scoped: false // SFCTemplateBlock 没有 scoped 属性，这里设为 false
    }
  }

  /**
   * 解析脚本部分
   */
  private parseScript(
    script: SFCScriptBlock | null,
    scriptSetup: SFCScriptBlock | null
  ): ParseResult['script'] {
    // 优先使用 <script setup>
    const targetScript = scriptSetup || script
    if (!targetScript) return undefined

    return {
      content: targetScript.content,
      lang: targetScript.lang || 'js',
      setup: !!scriptSetup
    }
  }

  /**
   * 解析样式部分
   */
  private parseStyles(styles: SFCStyleBlock[]): ParseResult['styles'] {
    return styles.map(style => ({
      content: style.content,
      lang: style.lang || 'css',
      scoped: style.scoped || false,
      module: typeof style.module === 'boolean' ? style.module : !!style.module
    }))
  }

  /**
   * 解析自定义块
   */
  private parseCustomBlocks(customBlocks: SFCDescriptor['customBlocks']): ParseResult['customBlocks'] {
    return customBlocks.map(block => ({
      type: block.type,
      content: block.content,
      attrs: block.attrs
    }))
  }

  /**
   * 编译 <script setup>
   */
  async compileScriptSetup(descriptor: SFCDescriptor): Promise<{
    content: string
    bindings: Record<string, any>
    imports: Record<string, any>
    props: string[]
    emits: string[]
  } | null> {
    if (!descriptor.scriptSetup) return null

    try {
      logger.debug(`编译 <script setup>: ${descriptor.filename}`)

      const compiled = compileScript(descriptor, {
        id: descriptor.filename || 'anonymous',
        isProd: !this.options.optimization.sourcemap,
        inlineTemplate: !descriptor.template,
        templateOptions: {
          ssr: false,
          compilerOptions: {
            mode: 'module'
          }
        }
      })

      return {
        content: compiled.content,
        bindings: compiled.bindings || {},
        imports: compiled.imports || {},
        props: [], // 从 bindings 中提取 props
        emits: [] // 从 bindings 中提取 emits
      }

    } catch (error) {
      logger.error(`<script setup> 编译失败: ${descriptor.filename}`, error as Error)
      throw error
    }
  }

  /**
   * 检查是否包含 TypeScript
   */
  hasTypeScript(result: ParseResult): boolean {
    return result.script?.lang === 'ts' || result.script?.lang === 'typescript'
  }

  /**
   * 检查是否包含 SCSS
   */
  hasSCSS(result: ParseResult): boolean {
    return result.styles.some(style =>
      style.lang === 'scss' || style.lang === 'sass'
    )
  }

  /**
   * 检查是否使用 <script setup>
   */
  hasScriptSetup(result: ParseResult): boolean {
    return result.script?.setup === true
  }

  /**
   * 检查是否包含作用域样式
   */
  hasScopedStyles(result: ParseResult): boolean {
    return result.styles.some(style => style.scoped)
  }

  /**
   * 获取组件名称
   */
  getComponentName(result: ParseResult): string {
    const filename = result.filename
    const basename = filename.split('/').pop()?.replace(/\.vue$/, '') || 'Component'

    // 转换为 PascalCase
    return basename
      .split('-')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('')
  }

  /**
   * 验证 SFC 结构
   */
  validateSFC(result: ParseResult): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // 检查必需的部分
    if (!result.template && !result.script) {
      errors.push('SFC 必须包含 template 或 script 部分')
    }

    // 检查 TypeScript 支持
    if (this.hasTypeScript(result) && !this.options.features.typescript) {
      errors.push('当前配置不支持 TypeScript')
    }

    // 检查 SCSS 支持
    if (this.hasSCSS(result) && !this.options.features.scss) {
      errors.push('当前配置不支持 SCSS')
    }

    // 检查 <script setup> 支持
    if (this.hasScriptSetup(result) && !this.options.features.scriptSetup) {
      errors.push('当前配置不支持 <script setup>')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }
}
