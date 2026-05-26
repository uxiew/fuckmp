/**
 * 基于 @vue/compiler-sfc AST 的 Vue 模板转换器
 * 提供精确的 Vue 模板到小程序模板的转换
 */

import { compileTemplate } from '@vue/compiler-sfc'
import { recordUnsupportedTemplateCapabilities, logger } from '@/utils/index.js'
import type { TransformContext } from '@/types/index.js'
import type { TemplateParseResult } from '@/parser/index.js'
import { transformVueTemplateFallbackString } from './vue-template-node-utils.js'
import { transformVueTemplateASTNode } from './vue-template-transformer-utils.js'

// 导入标准的转换结果类型
import type { TemplateTransformResult } from './template-transformer.js'

/**
 * Vue 模板转换器 - 基于 AST 精确操作
 */
export class VueTemplateTransformer {
  /**
   * 转换模板
   */
  async transformTemplate(
    parseResult: TemplateParseResult,
    context: TransformContext
  ): Promise<TemplateTransformResult> {
    try {
      logger.debug(`Vue AST 模板转换: ${context.filename}`)

      const result: TemplateTransformResult = {
        wxml: '',
        components: new Set(),
        eventHandlers: new Map()
      }

      recordUnsupportedTemplateCapabilities(parseResult.source, context)

      // 使用 @vue/compiler-sfc 编译模板获取 AST
      const compiledTemplate = compileTemplate({
        source: parseResult.source,
        filename: context.filename,
        id: context.filename,
        compilerOptions: {
          mode: 'module',
          prefixIdentifiers: false,
          hoistStatic: false,
          cacheHandlers: false
        }
      })

      if (compiledTemplate.errors.length > 0) {
        logger.warn(`Vue 模板编译警告: ${compiledTemplate.errors.join(', ')}`)
      }

      // 从编译结果中提取 AST
      if (compiledTemplate.ast) {
        result.wxml = transformVueTemplateASTNode(compiledTemplate.ast, result, context)
      } else {
        // 如果没有 AST，回退到字符串处理
        logger.warn(`无法获取 AST，使用字符串处理: ${context.filename}`)
        result.wxml = transformVueTemplateFallbackString(parseResult.source)
      }

      // 收集组件信息
      parseResult.components.forEach((component: string) => {
        result.components.add(component)
        context.components.set(component, `./${component}`)
      })

      logger.debug(`Vue AST 模板转换完成: ${context.filename}`)
      return result

    } catch (error) {
      logger.error(`Vue AST 模板转换失败: ${context.filename}`, error as Error)
      // 回退到字符串处理
      return this.fallbackTransform(parseResult, context)
    }
  }

  /**
   * 完全回退的转换方法
   */
  private async fallbackTransform(parseResult: TemplateParseResult, context: TransformContext): Promise<TemplateTransformResult> {
    logger.warn(`使用完全回退处理: ${context.filename}`)

    const result: TemplateTransformResult = {
      wxml: transformVueTemplateFallbackString(parseResult.source),
      components: new Set(),
      eventHandlers: new Map()
    }

    return result
  }
}
