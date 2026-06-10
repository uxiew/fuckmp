/**
 * 编译器监听模式辅助函数。
 */

import { logger } from '@/utils/index.js'

/** 监听模式需要调用的编译器最小接口。 */
export interface CompilerWatchHost {
  /** 编译单个 Vue 源文件。 */
  compileFile(filePath: string): Promise<void>
  /** 刷新 app/runtime/project 等依赖全局状态的输出。 */
  refreshProjectOutputs(): Promise<void>
  /** 移除源文件状态并清理对应生成产物。 */
  removeSourceFile(filePath: string): Promise<string[]>
}

/** 编译器监听模式事件处理器集合。 */
export interface CompilerWatchHandlers {
  /** 处理已有文件变更。 */
  change(filePath: string): Promise<void>
  /** 处理新增 Vue 文件。 */
  add(filePath: string): Promise<void>
  /** 处理 Vue 文件删除。 */
  unlink(filePath: string): Promise<void>
}

/** 监听模式 chokidar 配置。 */
export interface CompilerWatchOptions {
  /** 忽略无需监听的路径。 */
  ignored: RegExp
  /** 保持监听进程常驻。 */
  persistent: boolean
}

/**
 * 构造监听 Vue SFC 的 glob pattern。
 */
export function createVueFileWatchPattern(inputRoot: string): string {
  return `${inputRoot}/**/*.vue`
}

/**
 * 构造与旧 compiler.watch 行为一致的 chokidar options。
 */
export function createVueFileWatchOptions(): CompilerWatchOptions {
  return {
    ignored: /node_modules/,
    persistent: true
  }
}

/**
 * 创建 compiler watch 事件处理器。
 */
export function createCompilerWatchHandlers(host: CompilerWatchHost): CompilerWatchHandlers {
  return {
    change: filePath => handleCompileWatchEvent({
      startMessage: `文件变更: ${filePath}`,
      successMessage: `文件重新编译完成: ${filePath}`,
      errorMessage: `文件重新编译失败: ${filePath}`,
      run: async () => {
        await host.compileFile(filePath)
        await host.refreshProjectOutputs()
      }
    }),
    add: filePath => handleCompileWatchEvent({
      startMessage: `新增文件: ${filePath}`,
      successMessage: `新文件编译完成: ${filePath}`,
      errorMessage: `新文件编译失败: ${filePath}`,
      run: async () => {
        await host.compileFile(filePath)
        await host.refreshProjectOutputs()
      }
    }),
    unlink: filePath => handleCompileWatchEvent({
      startMessage: `删除文件: ${filePath}`,
      errorMessage: `清理输出产物失败: ${filePath}`,
      run: async () => {
        const removedFiles = await host.removeSourceFile(filePath)
        logger.success(`已清理输出产物: ${removedFiles.length} 个`)
      }
    })
  }
}

interface CompileWatchEventOptions {
  startMessage: string
  successMessage?: string
  errorMessage: string
  run(): Promise<void>
}

/**
 * 执行单次 watch 事件，保持旧策略：记录失败但不向 chokidar 抛出异常。
 */
async function handleCompileWatchEvent(options: CompileWatchEventOptions): Promise<void> {
  logger.info(options.startMessage)

  try {
    await options.run()

    if (options.successMessage) {
      logger.success(options.successMessage)
    }
  } catch (error) {
    logger.error(options.errorMessage, error as Error)
  }
}
