import type { ComponentConfig, ComponentManagerConfig } from './component.js'

const MERGED_OBJECT_KEYS: Array<keyof ComponentConfig> = [
  'data',
  'computed',
  'watch',
  'methods',
  'lifecycle',
  'providers',
  'injectors',
  'events',
  'bindings',
  'slots',
  'conditionals',
  'lists'
]

/**
 * 按当前 ComponentManager 语义处理 mixins 与 extends。
 */
export function processComponentConfig(
  config: ComponentConfig,
  options: Pick<ComponentManagerConfig, 'enableMixins' | 'enableInheritance'>
): ComponentConfig {
  let processedConfig = { ...config }

  if (options.enableMixins && config.mixins) {
    processedConfig = applyComponentMixins(processedConfig, config.mixins)
  }

  if (options.enableInheritance && config.extends) {
    processedConfig = applyComponentInheritance(processedConfig, config.extends)
  }

  return processedConfig
}

/**
 * 按原有顺序将 mixin 配置合并到当前配置。
 */
export function applyComponentMixins(
  config: ComponentConfig,
  mixins: ComponentConfig[]
): ComponentConfig {
  let result = { ...config }

  for (const mixin of mixins) {
    result = mergeComponentConfigs(result, mixin)
  }

  return result
}

/**
 * 按原有 extends 语义合并父配置与当前配置。
 */
export function applyComponentInheritance(
  config: ComponentConfig,
  parent: ComponentConfig
): ComponentConfig {
  return mergeComponentConfigs(parent, config)
}

/**
 * 合并组件配置，保持原 ComponentManager 的浅合并与覆盖规则。
 */
export function mergeComponentConfigs(
  base: ComponentConfig,
  override: ComponentConfig
): ComponentConfig {
  const result: ComponentConfig = { ...base }

  for (const key of MERGED_OBJECT_KEYS) {
    if (override[key]) {
      result[key] = {
        ...(base[key] as Record<string, any> | undefined),
        ...(override[key] as Record<string, any>)
      }
    }
  }

  if (override.mixins) {
    result.mixins = [...(base.mixins || []), ...override.mixins]
  }

  if (override.extends) {
    result.extends = override.extends
  }
  if (override.parent) {
    result.parent = override.parent
  }

  return result
}
