/**
 * 生命周期宏处理器
 */

import type { TransformContext, MacroHandler } from '@/types/index.js'
import { LIFECYCLE_MAP } from '@/types/index.js'
import { logger } from '@/utils/index.js'
import { extractLifecycleCallback, resolveMiniprogramLifecycleHook } from './lifecycle-utils.js'

/**
 * 生命周期钩子信息
 */
export interface LifecycleHook {
  name: string
  callback: string
  miniprogramHook: string
  isPageHook: boolean
}

/**
 * 生命周期宏处理器工厂
 */
export function createLifecycleHandler(hookName: string): MacroHandler {
  return (node: any, context: TransformContext) => {
    try {
      logger.debug(`处理 ${hookName} 生命周期钩子: ${context.filename}`)

      const arg = node.arguments[0]
      if (!arg) {
        throw new Error(`${hookName} 需要一个回调函数参数`)
      }

      // 提取回调函数
      const callback = extractLifecycleCallback(arg)

      // 获取对应的小程序生命周期钩子
      const miniprogramHook = resolveMiniprogramLifecycleHook(hookName, context.isPage)

      const lifecycleHook: LifecycleHook = {
        name: hookName,
        callback,
        miniprogramHook,
        isPageHook: context.isPage
      }

      // 更新上下文
      if (!context.lifecycle[miniprogramHook]) {
        context.lifecycle[miniprogramHook] = ''
      }
      context.lifecycle[miniprogramHook] += callback + '\n'

      logger.debug(`${hookName} 处理完成: 映射到 ${miniprogramHook}`)
      return lifecycleHook

    } catch (error) {
      logger.error(`${hookName} 处理失败: ${context.filename}`, error as Error)
      throw error
    }
  }
}

/**
 * 生成生命周期代码
 */
export function generateLifecycleCode(
  lifecycleHooks: Record<string, string>,
  isPage: boolean
): string {
  if (isPage) {
    return generatePageLifecycleCode(lifecycleHooks)
  } else {
    return generateComponentLifecycleCode(lifecycleHooks)
  }
}

/**
 * 生成页面生命周期代码
 */
function generatePageLifecycleCode(lifecycleHooks: Record<string, string>): string {
  const hooks: string[] = []

  Object.entries(lifecycleHooks).forEach(([hookName, code]) => {
    if (code.trim()) {
      hooks.push(`  ${hookName}(options) {
    ${code.trim()}
  }`)
    }
  })

  return hooks.join(',\n\n')
}

/**
 * 生成组件生命周期代码
 */
function generateComponentLifecycleCode(lifecycleHooks: Record<string, string>): string {
  const lifetimes: string[] = []
  const pageLifetimes: string[] = []

  Object.entries(lifecycleHooks).forEach(([hookName, code]) => {
    if (!code.trim()) return

    if (hookName.startsWith('pageLifetimes.')) {
      const pageLiftimeName = hookName.replace('pageLifetimes.', '')
      pageLifetimes.push(`    ${pageLiftimeName}() {
      ${code.trim()}
    }`)
    } else {
      lifetimes.push(`    ${hookName}() {
      ${code.trim()}
    }`)
    }
  })

  const result: string[] = []

  if (lifetimes.length > 0) {
    result.push(`  lifetimes: {
${lifetimes.join(',\n\n')}
  }`)
  }

  if (pageLifetimes.length > 0) {
    result.push(`  pageLifetimes: {
${pageLifetimes.join(',\n\n')}
  }`)
  }

  return result.join(',\n\n')
}

/**
 * 验证生命周期钩子
 */
export function validateLifecycleHook(hookName: string, isPage: boolean): {
  valid: boolean
  message?: string
} {
  const validVueHooks = Object.keys(LIFECYCLE_MAP)

  if (!validVueHooks.includes(hookName)) {
    return {
      valid: false,
      message: `未知的 Vue 生命周期钩子: ${hookName}`
    }
  }

  // 检查页面特定的钩子
  const pageOnlyHooks = ['onLoad', 'onShow', 'onReady', 'onHide', 'onUnload']
  if (!isPage && pageOnlyHooks.includes(hookName)) {
    return {
      valid: false,
      message: `生命周期钩子 ${hookName} 只能在页面组件中使用`
    }
  }

  return { valid: true }
}

/**
 * 获取支持的生命周期钩子列表
 */
export function getSupportedHooks(isPage: boolean): string[] {
  const allHooks = Object.keys(LIFECYCLE_MAP)

  if (isPage) {
    return allHooks
  } else {
    // 组件不支持页面特定的钩子
    const pageOnlyHooks = ['onLoad', 'onShow', 'onReady', 'onHide', 'onUnload']
    return allHooks.filter(hook => !pageOnlyHooks.includes(hook))
  }
}
