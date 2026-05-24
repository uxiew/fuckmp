import type { TransformContext } from '@/types/index.js'

export interface GenerateTargetDeps {
  pageGenerator: {
    generatePage(script: any, template: any, styles: any[], context: TransformContext): Promise<any>
  }
  componentGenerator: {
    generateComponent(script: any, template: any, styles: any[], context: TransformContext): Promise<any>
  }
}

/**
 * 按当前转换上下文路由到页面或组件生成器。
 */
export async function generateTargetCode(
  results: any,
  context: TransformContext,
  deps: GenerateTargetDeps
): Promise<any> {
  if (context.isPage) {
    return await deps.pageGenerator.generatePage(
      results.script,
      results.template,
      results.styles || [],
      context
    )
  }

  return await deps.componentGenerator.generateComponent(
    results.script,
    results.template,
    results.styles || [],
    context
  )
}
