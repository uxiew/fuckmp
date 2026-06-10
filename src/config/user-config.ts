/**
 * 用户配置管理
 */

import { readFileSync, existsSync } from 'fs'
import { createRequire } from 'module'
import { resolve, dirname } from 'path'
import { Script, createContext } from 'vm'
import { logger } from '@/utils/index.js'
import type { UserConfig } from './user-config-types.js'
import {
  createDefaultUserConfig,
  normalizeJavaScriptConfigSource,
  normalizeUserConfigExport
} from './user-config-utils.js'

export type { UserConfig } from './user-config-types.js'

/**
 * 用户配置管理器
 */
export class UserConfigManager {
  private config: UserConfig = {}
  private configPath: string = ''

  /**
   * 加载用户配置
   */
  loadConfig(projectRoot: string): UserConfig {
    this.config = {}
    this.configPath = ''

    // 查找配置文件
    const configFiles = [
      'vue3mp.config.js',
      'vue3mp.config.ts',
      'vue3mp.config.json',
      '.vue3mprc.js',
      '.vue3mprc.ts',
      '.vue3mprc.json'
    ]

    for (const configFile of configFiles) {
      const configPath = resolve(projectRoot, configFile)
      if (existsSync(configPath)) {
        const loadedConfig = this.loadConfigFile(configPath)
        if (loadedConfig) {
          this.configPath = configPath
          this.config = loadedConfig
          logger.info(`加载用户配置: ${configFile}`)
          break
        }
      }
    }

    // 如果没有找到配置文件，使用默认配置
    if (!this.configPath) {
      logger.debug('未找到用户配置文件，使用默认配置')
      this.config = createDefaultUserConfig()
    }

    return this.config
  }

  /**
   * 获取配置
   */
  getConfig(): UserConfig {
    return this.config
  }

  /**
   * 获取应用配置
   */
  getAppConfig(): UserConfig['app'] {
    return this.config.app || {}
  }

  /**
   * 获取页面配置
   */
  getPageConfig(pagePath: string) {
    return this.config.pages?.[pagePath] || {}
  }

  /**
   * 获取组件配置
   */
  getComponentConfig(componentPath: string) {
    return this.config.components?.[componentPath] || {}
  }

  /**
   * 获取页面标题映射
   */
  getPageTitles(): UserConfig['pageTitles'] {
    return this.config.pageTitles || {}
  }

  /**
   * 获取默认配置（公共方法）
   */
  getDefaultConfigValues(): UserConfig {
    return createDefaultUserConfig()
  }

  /**
   * 获取项目配置
   */
  getProjectConfig(): UserConfig['project'] {
    return this.config.project || {}
  }

  /**
   * 加载配置文件
   */
  private loadConfigFile(configPath: string): UserConfig | null {
    try {
      if (configPath.endsWith('.json')) {
        const content = readFileSync(configPath, 'utf-8')
        return JSON.parse(content)
      }

      if (configPath.endsWith('.js')) {
        return this.loadJavaScriptConfigFile(configPath)
      }

      logger.warn(`TypeScript 配置文件暂不支持，已跳过: ${configPath}`)
      return null
    } catch (error) {
      logger.error(`加载配置文件失败: ${configPath}`, error as Error)
      return {}
    }
  }

  /**
   * 同步加载 JavaScript 用户配置。
   */
  private loadJavaScriptConfigFile(configPath: string): UserConfig {
    const content = readFileSync(configPath, 'utf-8')
    const moduleObject: { exports: unknown } = { exports: {} }
    const sandbox = {
      module: moduleObject,
      exports: moduleObject.exports,
      require: createRequire(configPath),
      __dirname: dirname(configPath),
      __filename: configPath,
      process,
      console,
      defineConfig: <T>(config: T): T => config
    }
    const script = new Script(normalizeJavaScriptConfigSource(content), {
      filename: configPath
    })

    script.runInContext(createContext(sandbox), { timeout: 1000 })

    return normalizeUserConfigExport(moduleObject.exports)
  }
}
