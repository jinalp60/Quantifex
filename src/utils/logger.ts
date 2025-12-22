type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  metadata?: Record<string, any>
}

export function log(level: LogLevel, message: string, metadata?: Record<string, any>) {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    metadata,
  }
  
  const logMessage = JSON.stringify(entry)
  
  switch (level) {
    case 'error':
      console.error(logMessage)
      break
    case 'warn':
      console.warn(logMessage)
      break
    case 'debug':
      if (process.env.NODE_ENV === 'development') {
        console.debug(logMessage)
      }
      break
    default:
      console.log(logMessage)
  }
}

export const logger = {
  info: (message: string, metadata?: Record<string, any>) => log('info', message, metadata),
  warn: (message: string, metadata?: Record<string, any>) => log('warn', message, metadata),
  error: (message: string, metadata?: Record<string, any>) => log('error', message, metadata),
  debug: (message: string, metadata?: Record<string, any>) => log('debug', message, metadata),
}

