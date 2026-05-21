/**
 * 编译器 TransformContext 合并工具。
 *
 * 主编译流程只负责阶段编排；脚本转换上下文的字段级合并集中在这里，
 * 避免 `compiler.ts` 继续堆积低层状态同步细节。
 */
import type { TransformContext } from '@/types/index.js'

/**
 * 将脚本转换阶段产出的上下文合并回当前文件的主转换上下文。
 */
export function mergeScriptTransformContext(
  target: TransformContext,
  scriptContext: TransformContext
): void {
  Object.assign(target.data, scriptContext.data)
  Object.assign(target.methods, scriptContext.methods)
  Object.assign(target.computed, scriptContext.computed)
  Object.assign(target.lifecycle, scriptContext.lifecycle)
  Object.assign(target.watch, scriptContext.watch)
  Object.assign(target.expose, scriptContext.expose)
  Object.assign(target.props, scriptContext.props)

  target.emits = [...target.emits, ...scriptContext.emits]

  scriptContext.imports.forEach((imp: string) => target.imports.add(imp))
  scriptContext.components.forEach((path: string, name: string) => {
    target.components.set(name, path)
  })

  if (scriptContext.defineOptions) {
    target.defineOptions = scriptContext.defineOptions
  }

  if (scriptContext.defineSlots) {
    target.defineSlots = scriptContext.defineSlots
  }

  if (scriptContext.watcherEffects) {
    target.watcherEffects = scriptContext.watcherEffects
  }

  if (scriptContext.templateRefs) {
    target.templateRefs = scriptContext.templateRefs
  }

  if (scriptContext.useIds) {
    target.useIds = scriptContext.useIds
  }

  if (scriptContext.provideInject) {
    target.provideInject = scriptContext.provideInject
  }

  if (scriptContext.styleImports) {
    target.styleImports = scriptContext.styleImports
  }

  if (scriptContext.reactiveVariables) {
    target.reactiveVariables = scriptContext.reactiveVariables
  }

  if (scriptContext.propAliases) {
    target.propAliases = scriptContext.propAliases
  }

  if (scriptContext.propNamespaces) {
    target.propNamespaces = scriptContext.propNamespaces
  }
}
