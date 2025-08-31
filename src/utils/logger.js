class Logger {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  formatMessage(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      level: level.toUpperCase(),
      message
    };

    if (data) {
      logData.data = data;
    }

    return this.isDevelopment 
      ? JSON.stringify(logData, null, 2)
      : JSON.stringify(logData);
  }

  info(message, data = null) {
    console.log(this.formatMessage('info', message, data));
  }

  error(message, data = null) {
    console.error(this.formatMessage('error', message, data));
  }

  warn(message, data = null) {
    console.warn(this.formatMessage('warn', message, data));
  }

  debug(message, data = null) {
    if (this.isDevelopment) {
      console.debug(this.formatMessage('debug', message, data));
    }
  }
}

export const logger = new Logger();