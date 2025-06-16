/**
 * 日志工具
 */

import pc from 'picocolors'
import type { LogLevel } from '@/types/index.js'

/**
 * 日志级别枚举
 */
const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
} as const

/**
 * 日志器类
 */
export class Logger {
  private level: LogLevel
  private prefix: string

  constructor(prefix = 'Vue3MP', level: LogLevel = 'info') {
    this.prefix = prefix
    this.level = level
  }

  /**
   * 设置日志级别
   */
  setLevel(level: LogLevel) {
    this.level = level
  }

  /**
   * 获取当前日志级别
   */
  getLevel(): LogLevel {
    return this.level
  }

  /**
   * 设置前缀
   */
  setPrefix(prefix: string) {
    this.prefix = prefix
  }

  /**
   * 检查是否应该输出日志
   */
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.level]
  }

  /**
   * 格式化时间戳
   */
  private formatTimestamp(): string {
    const now = new Date()
    return pc.gray(`[${now.toLocaleTimeString()}]`)
  }

  /**
   * 格式化前缀
   */
  private formatPrefix(): string {
    return pc.cyan(`[${this.prefix}]`)
  }

  /**
   * Debug 日志
   */
  debug(message: string, ...args: any[]) {
    if (!this.shouldLog('debug')) return
    console.log(
      this.formatTimestamp(),
      this.formatPrefix(),
      pc.gray('[DEBUG]'),
      message,
      ...args
    )
  }

  /**
   * Info 日志
   */
  info(message: string, ...args: any[]) {
    if (!this.shouldLog('info')) return
    console.log(
      this.formatTimestamp(),
      this.formatPrefix(),
      pc.blue('[INFO]'),
      message,
      ...args
    )
  }

  /**
   * Warning 日志
   */
  warn(message: string, ...args: any[]) {
    if (!this.shouldLog('warn')) return
    console.warn(
      this.formatTimestamp(),
      this.formatPrefix(),
      pc.yellow('[WARN]'),
      pc.yellow(message),
      ...args
    )
  }

  /**
   * Error 日志
   */
  error(message: string, error?: Error, ...args: any[]) {
    if (!this.shouldLog('error')) return
    console.error(
      this.formatTimestamp(),
      this.formatPrefix(),
      pc.red('[ERROR]'),
      pc.red(message),
      ...args
    )
    if (error) {
      console.error(pc.red(error.stack || error.message))
    }
  }

  /**
   * Success 日志
   */
  success(message: string, ...args: any[]) {
    if (!this.shouldLog('info')) return
    console.log(
      this.formatTimestamp(),
      this.formatPrefix(),
      pc.green('[SUCCESS]'),
      pc.green(message),
      ...args
    )
  }

  /**
   * 创建子日志器
   */
  child(prefix: string): Logger {
    return new Logger(`${this.prefix}:${prefix}`, this.level)
  }
}

/**
 * 默认日志器实例
 */
export const logger = new Logger()

/**
 * 创建日志器
 */
export function createLogger(prefix?: string, level?: LogLevel): Logger {
  return new Logger(prefix, level)
}
