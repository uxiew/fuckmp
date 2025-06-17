/**
 * 运行时库打包器
 * 根据特性使用情况，按需打包运行时库
 */

import type { Vue3FeatureUsage, RuntimeInjectionConfig } from './runtime-injector'
import { logger } from '@/utils/logger'

/**
 * 运行时模块定义
 */
export interface RuntimeModule {
  /** 模块名称 */
  name: string
  /** 模块路径 */
  path: string
  /** 模块大小（字节） */
  size: number
  /** 依赖的其他模块 */
  dependencies: string[]
  /** 模块代码 */
  code: string
  /** 是否为核心模块 */
  isCore: boolean
}

/**
 * 打包结果
 */
export interface BundleResult {
  /** 打包后的代码 */
  code: string
  /** 包含的模块列表 */
  modules: string[]
  /** 总大小 */
  totalSize: number
  /** 压缩后大小 */
  minifiedSize: number
  /** 源映射 */
  sourceMap?: string
}

/**
 * 运行时库打包器
 */
export class RuntimeBundler {
  private config: RuntimeInjectionConfig
  private availableModules: Map<string, RuntimeModule>

  constructor(config: RuntimeInjectionConfig) {
    this.config = config
    this.availableModules = new Map()
    this.initializeModules()
  }

  /**
   * 初始化可用模块
   */
  private initializeModules(): void {
    // 核心模块
    this.registerModule({
      name: 'core',
      path: './runtime/index.ts',
      size: 2048,
      dependencies: [],
      code: '',
      isCore: true
    })

    // 响应式模块
    this.registerModule({
      name: 'reactivity',
      path: './runtime/core/reactivity.ts',
      size: 4096,
      dependencies: ['core'],
      code: '',
      isCore: false
    })

    // 生命周期模块
    this.registerModule({
      name: 'lifecycle',
      path: './runtime/core/lifecycle.ts',
      size: 3072,
      dependencies: ['core'],
      code: '',
      isCore: false
    })

    // 模板引擎模块
    this.registerModule({
      name: 'template',
      path: './runtime/core/template.ts',
      size: 5120,
      dependencies: ['core', 'reactivity'],
      code: '',
      isCore: false
    })

    // 依赖注入模块
    this.registerModule({
      name: 'di',
      path: './runtime/core/di.ts',
      size: 2560,
      dependencies: ['core', 'reactivity'],
      code: '',
      isCore: false
    })

    // 事件系统模块
    this.registerModule({
      name: 'event',
      path: './runtime/core/event.ts',
      size: 3584,
      dependencies: ['core'],
      code: '',
      isCore: false
    })

    // 组件管理器模块
    this.registerModule({
      name: 'component',
      path: './runtime/core/component.ts',
      size: 4608,
      dependencies: ['core', 'lifecycle', 'reactivity'],
      code: '',
      isCore: false
    })

    logger.info(`已注册 ${this.availableModules.size} 个运行时模块`)
  }

  /**
   * 注册模块
   */
  private registerModule(module: RuntimeModule): void {
    this.availableModules.set(module.name, module)
  }

  /**
   * 根据特性使用情况确定需要的模块
   */
  getRequiredModules(featureUsage: Vue3FeatureUsage): string[] {
    const requiredModules = new Set<string>()

    // 核心模块总是需要的
    requiredModules.add('core')

    // 根据特性使用情况添加模块
    if (this.needsReactivity(featureUsage)) {
      requiredModules.add('reactivity')
    }

    if (this.needsLifecycle(featureUsage)) {
      requiredModules.add('lifecycle')
    }

    if (this.needsTemplate(featureUsage)) {
      requiredModules.add('template')
    }

    if (this.needsDI(featureUsage)) {
      requiredModules.add('di')
    }

    if (this.needsEvent(featureUsage)) {
      requiredModules.add('event')
    }

    if (this.needsComponent(featureUsage)) {
      requiredModules.add('component')
    }

    // 解析依赖关系
    const resolvedModules = this.resolveDependencies(Array.from(requiredModules))

    logger.info(`需要的运行时模块: ${resolvedModules.join(', ')}`)
    return resolvedModules
  }

  /**
   * 检查是否需要响应式模块
   */
  private needsReactivity(usage: Vue3FeatureUsage): boolean {
    return Object.values(usage.reactivity).some(used => used) ||
      usage.composition.setup ||
      Object.values(usage.directives).some(used => used)
  }

  /**
   * 检查是否需要生命周期模块
   */
  private needsLifecycle(usage: Vue3FeatureUsage): boolean {
    return Object.values(usage.lifecycle).some(used => used) ||
      usage.composition.setup
  }

  /**
   * 检查是否需要模板引擎模块
   */
  private needsTemplate(usage: Vue3FeatureUsage): boolean {
    return Object.values(usage.directives).some(used => used) ||
      usage.advanced.slots
  }

  /**
   * 检查是否需要依赖注入模块
   */
  private needsDI(usage: Vue3FeatureUsage): boolean {
    return usage.composition.provide || usage.composition.inject
  }

  /**
   * 检查是否需要事件系统模块
   */
  private needsEvent(usage: Vue3FeatureUsage): boolean {
    return usage.directives.vOn || usage.directives.vModel
  }

  /**
   * 检查是否需要组件管理器模块
   */
  private needsComponent(usage: Vue3FeatureUsage): boolean {
    return usage.composition.setup ||
      usage.composition.defineProps ||
      usage.composition.defineEmits
  }

  /**
   * 解析模块依赖关系
   */
  private resolveDependencies(moduleNames: string[]): string[] {
    const resolved = new Set<string>()
    const visited = new Set<string>()

    const resolve = (moduleName: string) => {
      if (visited.has(moduleName)) return
      visited.add(moduleName)

      const module = this.availableModules.get(moduleName)
      if (!module) {
        logger.warn(`未找到模块: ${moduleName}`)
        return
      }

      // 先解析依赖
      for (const dep of module.dependencies) {
        resolve(dep)
      }

      // 再添加当前模块
      resolved.add(moduleName)
    }

    for (const moduleName of moduleNames) {
      resolve(moduleName)
    }

    return Array.from(resolved)
  }

  /**
   * 打包运行时库
   */
  async bundle(featureUsage: Vue3FeatureUsage): Promise<BundleResult> {
    logger.info('开始打包运行时库...')

    const requiredModules = this.getRequiredModules(featureUsage)
    const bundleCode = await this.generateBundleCode(requiredModules)

    const result: BundleResult = {
      code: bundleCode,
      modules: requiredModules,
      totalSize: bundleCode.length,
      minifiedSize: bundleCode.length // TODO: 实际压缩
    }

    if (this.config.minify) {
      result.code = this.minifyCode(result.code)
      result.minifiedSize = result.code.length
    }

    logger.info(`运行时库打包完成: ${result.modules.length} 个模块, ${result.totalSize} 字节`)
    if (this.config.minify) {
      logger.info(`压缩后大小: ${result.minifiedSize} 字节 (压缩率: ${((1 - result.minifiedSize / result.totalSize) * 100).toFixed(1)}%)`)
    }

    return result
  }

  /**
   * 生成打包代码
   */
  private async generateBundleCode(moduleNames: string[]): Promise<string> {
    const fs = await import('fs/promises')
    const path = await import('path')

    let bundleCode = `
// Vue3 小程序运行时库 v${this.config.runtimeVersion}
// 自动生成，请勿手动修改
// 包含模块: ${moduleNames.join(', ')}

(function(global) {
  // 运行时库命名空间
  const Vue3MiniRuntime = {};
  
`

    // 加载并合并模块代码
    for (const moduleName of moduleNames) {
      const module = this.availableModules.get(moduleName)
      if (!module) continue

      try {
        const moduleCode = await this.loadModuleCode(module.path)
        bundleCode += `
  // === 模块: ${moduleName} ===
  ${this.wrapModuleCode(moduleCode, moduleName)}
  
`
      } catch (error) {
        logger.warn(`加载模块失败: ${moduleName}`, error)
      }
    }

    bundleCode += `
  // 导出运行时库
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Vue3MiniRuntime;
  } else {
    global.Vue3MiniRuntime = Vue3MiniRuntime;
  }
  
})(typeof global !== 'undefined' ? global : this);
`

    return bundleCode
  }

  /**
   * 加载模块代码
   */
  private async loadModuleCode(modulePath: string): Promise<string> {
    const fs = await import('fs/promises')
    const path = await import('path')
    const { fileURLToPath } = await import('url')

    // 获取当前文件的目录路径（ES 模块兼容）
    const currentDir = typeof __dirname !== 'undefined'
      ? __dirname
      : path.dirname(fileURLToPath(import.meta.url))

    const fullPath = path.resolve(currentDir, '..', modulePath)
    return await fs.readFile(fullPath, 'utf-8')
  }

  /**
   * 包装模块代码
   */
  private wrapModuleCode(code: string, moduleName: string): string {
    // 简单的模块包装，实际实现中应该更复杂
    return `
  (function() {
    ${code.replace(/export\s+/g, 'Vue3MiniRuntime.')}
  })();
`
  }

  /**
   * 压缩代码
   */
  private minifyCode(code: string): string {
    // 简单的代码压缩，实际实现中应该使用专业的压缩工具
    return code
      .replace(/\/\*[\s\S]*?\*\//g, '') // 移除块注释
      .replace(/\/\/.*$/gm, '') // 移除行注释
      .replace(/\s+/g, ' ') // 压缩空白
      .replace(/;\s*}/g, '}') // 移除分号前的空格
      .trim()
  }
}
