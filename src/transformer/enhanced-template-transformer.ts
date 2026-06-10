/**
 * 增强的模板转换器 - 基于 node-html-parser
 * 提供更精确的 HTML/XML 解析和转换能力
 */

import { parse } from 'node-html-parser'
import { logger } from '@/utils/index.js'
import type { TemplateParseResult } from '@/parser/index.js'
import type { TransformContext } from '@/types/index.js'
import type { TemplateTransformResult } from './template-transformer.js'
import { transformEnhancedTemplateNode } from './enhanced-template-transformer-utils.js'

/**
 * 增强的模板转换器类
 */
export class EnhancedTemplateTransformer {
  /**
   * 转换模板
   */
  async transformTemplate(
    parseResult: TemplateParseResult,
    context: TransformContext
  ): Promise<TemplateTransformResult> {
    try {
      logger.debug(`增强模板转换: ${context.filename}`)

      const result: TemplateTransformResult = {
        wxml: '',
        components: new Set(),
        eventHandlers: new Map(),
        customEventHandlers: new Set()
      }

      // 使用 node-html-parser 解析模板
      const root = parse(parseResult.source, {
        lowerCaseTagName: false,
        comment: false,
        blockTextElements: {
          script: false,
          noscript: false,
          style: false,
          pre: false
        }
      })

      // 转换根节点
      result.wxml = transformEnhancedTemplateNode(root, result, context)

      // 收集组件信息
      parseResult.components.forEach((component: string) => {
        result.components.add(component)
        context.components.set(component, `./${component}`)
      })

      logger.debug(`增强模板转换完成: ${context.filename}`)
      return result

    } catch (error) {
      logger.error(`增强模板转换失败: ${context.filename}`, error as Error)
      throw error
    }
  }

}
