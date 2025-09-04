export class BaseError extends Error {
    constructor(message, code, statusCode = 500, metadata = {}) {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        this.statusCode = statusCode;
        this.metadata = metadata;
        this.timestamp = new Date().toISOString();

        Error.captureStackTrace(this, this.constructor);
    }

    toJSON() {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            statusCode: this.statusCode,
            metadata: this.metadata,
            timestamp: this.timestamp
        };
    }
}

export class AuthenticationError extends BaseError {
    constructor(message, platform, metadata = {}) {
        super(message, 'AUTH_ERROR', 401, { platform, ...metadata });
    }
}

export class PlatformError extends BaseError {
    constructor(message, platform, operation, metadata = {}) {
        super(message, 'PLATFORM_ERROR', 500, { platform, operation, ...metadata });
    }
}

export class NetworkError extends BaseError {
    constructor(message, url, metadata = {}) {
        super(message, 'NETWORK_ERROR', 503, { url, ...metadata });
    }
}

export class ValidationError extends BaseError {
    constructor(message, field, metadata = {}) {
        super(message, 'VALIDATION_ERROR', 400, { field, ...metadata });
    }
}