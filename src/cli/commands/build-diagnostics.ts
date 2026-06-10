/**
 * build CLI 编译失败诊断辅助函数。
 */

/**
 * build 命令可消费的编译错误结构。
 */
export interface BuildDiagnosticError {
  /** 出错文件路径或配置项名称。 */
  file: string
  /** 原始错误信息。 */
  message: string
  /** 可选堆栈信息。 */
  stack?: string
}

/**
 * 根据编译错误生成面向迁移用户的可执行排查建议。
 */
export function createBuildFailureDiagnostics(errors: readonly BuildDiagnosticError[]): string[] {
  if (errors.length === 0) {
    return []
  }

  const text = errors
    .map(error => `${error.file}\n${error.message}\n${error.stack ?? ''}`)
    .join('\n')

  const diagnostics: string[] = []

  if (hasInputPathError(text)) {
    diagnostics.push('检查 --input 或 vue3mp.config.js 中的 input 是否指向存在且可访问的源码目录。')
  }

  if (hasOutputPathError(text)) {
    diagnostics.push('检查 --output 或 vue3mp.config.js 中的 output，避免与输入目录相同或写入不可访问目录。')
  }

  if (hasNativeBoundaryError(text)) {
    diagnostics.push(
      '发现明确降级的 Vue 能力，请改写为微信原生生命周期、事件回调、computed 派生状态或显式 props/emits 状态流。'
    )
    diagnostics.push('参考 docs/latest-platform-baseline.md 与 docs/migration-guide.md 的能力矩阵和迁移清单。')
  }

  if (hasAppIdOrDevToolsError(text)) {
    diagnostics.push(
      '检查 appId 是否为合法微信小程序 AppID；占位 AppID 只能用于本地静态编译，不适合 DevTools 真机/自动化验收。'
    )
    diagnostics.push('如果正在运行 DevTools 验收，请确认 WECHAT_IDE_CLI 指向微信开发者工具 CLI，并已登录且开启自动化能力。')
  }

  if (hasSfcOrSyntaxError(text)) {
    diagnostics.push('检查报错 .vue 文件的 <template> / <script setup lang="ts"> / <style> 结构和语法，先缩小到单页面纵向切片。')
  }

  if (diagnostics.length === 0) {
    diagnostics.push('使用 --verbose 复跑构建，定位首个失败文件，并按 docs/migration-guide.md 的验证清单逐项排查。')
  }

  return Array.from(new Set(diagnostics))
}

function hasInputPathError(text: string): boolean {
  return /输入目录不存在|input .*not found|ENOENT/i.test(text)
}

function hasOutputPathError(text: string): boolean {
  return /输出目录|output .*permission|EACCES|EPERM/i.test(text)
}

function hasNativeBoundaryError(text: string): boolean {
  return [
    /明确降级/,
    /defineExpose|defineOptions|defineSlots/,
    /watch\/watchEffect|watchEffect|onWatcherCleanup/,
    /provide\/inject|provide\(|inject\(/,
    /useTemplateRef/,
    /transition|keep-alive/i,
    /scoped slots|dynamic slots/i
  ].some(pattern => pattern.test(text))
}

function hasAppIdOrDevToolsError(text: string): boolean {
  return /AppID 不合法|invalid appid|WECHAT_IDE_CLI|DevTools|微信开发者工具/i.test(text)
}

function hasSfcOrSyntaxError(text: string): boolean {
  return /SFC 验证失败|parse|syntax|Unexpected token|template|script setup/i.test(text)
}
