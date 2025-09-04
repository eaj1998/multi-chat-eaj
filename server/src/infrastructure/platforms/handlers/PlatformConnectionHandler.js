import { Logger } from '../../../shared/utils/Logger.js';
import { PlatformError } from '../../../shared/errors/BaseError.js';

export class PlatformConnectionHandler {
    constructor(socketManager) {
        this.socketManager = socketManager;
        this.retryAttempts = new Map();
        this.maxRetries = 3;
        this.baseRetryDelay = 2000;
    }

    async handleConnectionError(clientId, platform, error, operation = 'connect') {
        const attempts = this.retryAttempts.get(clientId) || 0;

        const platformError = error instanceof PlatformError
            ? error
            : new PlatformError(error.message, platform, operation);

        Logger.error(`Erro de conexão ${platform}`, {
            clientId,
            operation,
            attempts,
            error: platformError.message,
            code: platformError.code
        });

        this.socketManager.emitToSocket(clientId, 'connection-error', {
            platform,
            operation,
            error: platformError.message,
            code: platformError.code,
            attempts,
            maxRetries: this.maxRetries,
            willRetry: attempts < this.maxRetries,
            metadata: platformError.metadata
        });

        if (attempts >= this.maxRetries) {
            const finalError = new PlatformError(
                'Máximo de tentativas de reconexão atingido',
                platform,
                'max_retries_reached',
                { attempts, originalError: platformError.message }
            );

            Logger.error(`Máximo de tentativas atingido para ${platform}`, {
                clientId,
                error: finalError.toJSON()
            });

            this.socketManager.emitToSocket(clientId, 'connection-failed', {
                platform,
                error: finalError.message,
                code: finalError.code,
                suggestion: 'Verifique sua conexão e tente novamente manualmente',
                metadata: finalError.metadata
            });

            this.retryAttempts.delete(clientId);
            return false;
        }

        this.retryAttempts.set(clientId, attempts + 1);
        return true;
    }

    async scheduleRetry(clientId, platform, retryFunction, delay = null) {
        const attempts = this.retryAttempts.get(clientId) || 0;
        const retryDelay = delay || Math.min(this.baseRetryDelay * Math.pow(2, attempts), 30000);

        Logger.info(`Agendando retry para ${platform}`, {
            clientId,
            attempts,
            delay: retryDelay
        });

        setTimeout(async () => {
            try {
                await retryFunction();

                this.retryAttempts.delete(clientId);

                this.socketManager.emitToSocket(clientId, 'connection-recovered', {
                    platform,
                    message: `Conexão com ${platform} restaurada com sucesso`,
                    attempts: attempts + 1
                });

                Logger.info(`Conexão ${platform} restaurada`, { clientId, attempts: attempts + 1 });

            } catch (error) {
                const retryError = new PlatformError(
                    `Retry falhou: ${error.message}`,
                    platform,
                    'retry',
                    { attempt: attempts + 1, originalError: error.message }
                );

                await this.handleConnectionError(clientId, platform, retryError, 'retry');
            }
        }, retryDelay);
    }

    clearRetries(clientId) {
        const hadRetries = this.retryAttempts.has(clientId);
        this.retryAttempts.delete(clientId);

        if (hadRetries) {
            Logger.info(`Retry attempts cleared for client: ${clientId}`);
        }
    }

    createConnectionError(message, platform, operation, metadata = {}) {
        return new PlatformError(message, platform, operation, metadata);
    }

    getRetryStatus(clientId) {
        const attempts = this.retryAttempts.get(clientId) || 0;

        return {
            hasActiveRetries: attempts > 0,
            attempts,
            maxRetries: this.maxRetries,
            nextRetryDelay: attempts > 0
                ? Math.min(this.baseRetryDelay * Math.pow(2, attempts), 30000)
                : null
        };
    }
}