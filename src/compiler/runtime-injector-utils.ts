/**
 * RuntimeInjector 的配置与生成文件写入 helper。
 */

import type { CompilerOptions } from '../types/compiler.js'
import type { RuntimeInjectionConfig } from './runtime-injector.js'
import type { RuntimeIntegrationConfig } from './runtime-integration.js'

/**
 * 基于运行时集成配置和编译模式创建运行时注入默认配置。
 */
export function createRuntimeInjectionConfig(
  baseConfig: RuntimeIntegrationConfig,
  compilerOptions: Pick<CompilerOptions, 'mode'>
): RuntimeInjectionConfig {
  return {
    ...baseConfig,
    treeshaking: true,
    minify: compilerOptions.mode === 'production',
    codeSplitting: true,
    chunkStrategy: 'feature',
    runtimeVersion: '1.0.0',
    customModules: []
  }
}

/**
 * 递归创建目录并写入 RuntimeInjector 生成的文件。
 */
export async function writeRuntimeGeneratedFiles(
  outputDir: string,
  files: Array<{ path: string; content: string }>,
  debug?: (message: string) => void
): Promise<void> {
  const fs = await import('fs/promises')
  const path = await import('path')

  for (const file of files) {
    const filePath = path.join(outputDir, file.path)
    const fileDir = path.dirname(filePath)

    await fs.mkdir(fileDir, { recursive: true })
    await fs.writeFile(filePath, file.content, 'utf-8')

    debug?.(`生成文件: ${file.path} (${file.content.length} 字节)`)
  }
}
