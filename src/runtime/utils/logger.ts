/**
 * 运行时日志工具
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LoggerConfig {
  level: LogLevel
  prefix: string
  enableTimestamp: boolean
  enableStackTrace: boolean
}

class Logger {
  private config: LoggerConfig = {
    level: 'info',
    prefix: '[Vue3Runtime]',
    enableTimestamp: true,
    enableStackTrace: false
  }

  private levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  }

  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config }
  }

  private shouldLog(level: LogLevel): boolean {
    return this.levels[level] >= this.levels[this.config.level]
  }

  private formatMessage(level: LogLevel, message: string, data?: any): string {
    let formatted = this.config.prefix

    if (this.config.enableTimestamp) {
      formatted += ` [${new Date().toISOString()}]`
    }

    formatted += ` [${level.toUpperCase()}] ${message}`

    if (data !== undefined) {
      formatted += ` ${JSON.stringify(data)}`
    }

    return formatted
  }

  debug(message: string, data?: any): void {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', message, data))
    }
  }

  info(message: string, data?: any): void {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', message, data))
    }
  }

  warn(message: string, data?: any): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, data))
    }
  }

  error(message: string, data?: any): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, data))
      
      if (this.config.enableStackTrace && data instanceof Error) {
        console.error(data.stack)
      }
    }
  }
}

export const logger = new Logger()
