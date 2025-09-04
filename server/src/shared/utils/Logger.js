export class Logger {
    static log(level, message, metadata = {}) {
        const timestamp = new Date().toISOString();

        if (level === 'error') {
            console.error(`[${timestamp}] ERROR: ${message}`,
                Object.keys(metadata).length > 0 ? metadata : '');
        } else {
            console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`,
                Object.keys(metadata).length > 0 ? metadata : '');
        }
    }

    static info(message, metadata = {}) {
        this.log('info', message, metadata);
    }

    static warn(message, metadata = {}) {
        this.log('warn', message, metadata);
    }

    static error(message, metadata = {}) {
        this.log('error', message, metadata);
    }

    static platform(platform, message, metadata = {}) {
        this.info(`[${platform.toUpperCase()}] ${message}`, metadata);
    }
}