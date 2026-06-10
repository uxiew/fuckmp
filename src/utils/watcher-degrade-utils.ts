/**
 * watch/watchEffect/onWatcherCleanup 原生目标降级工具。
 */

const WATCHER_DEGRADE_REASON =
  'Vue watcher side effects and Vue 3.5 watcher cleanup require Vue runtime scheduling; native output does not provide an equivalent watcher bridge.'

/**
 * 创建 watcher 降级记录。
 */
export function createWatcherDegradeRecord(apiName: string, previousApis: string[] = []): Record<string, any> {
  return {
    unsupported: true,
    strategy: 'explicit-degrade',
    target: 'miniprogram-native',
    apis: Array.from(new Set([...previousApis, apiName])).filter(Boolean),
    reason: WATCHER_DEGRADE_REASON
  }
}

/**
 * 生成 watch/watchEffect/onWatcherCleanup 在原生目标下的降级注释。
 */
export function generateWatcherDegradeComment(watcherEffects: Record<string, any>, targetLabel: string): string {
  if (!watcherEffects?.unsupported) {
    return ''
  }

  const apis = Array.isArray(watcherEffects.apis) && watcherEffects.apis.length > 0
    ? watcherEffects.apis.join(', ')
    : 'none'

  return `// watch/watchEffect 降级：微信原生${targetLabel}目标暂不提供 Vue watcher 副作用调度与 Vue 3.5 watcher cleanup 等价桥接。
// watcher APIs: ${apis}
// Vue 3.5 watcher cleanup: onWatcherCleanup must run synchronously inside watch/watchEffect callbacks.

`
}
