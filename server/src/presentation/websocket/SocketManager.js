import { Logger } from '../../shared/utils/Logger.js';

export class SocketManager {
    constructor(io) {
        this.io = io;
    }

    broadcast(event, data) {
        this.io.emit(event, data);
        Logger.info(`Broadcasting: ${event}`, { dataKeys: Object.keys(data) });
    }

    emitToSocket(socketId, event, data) {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket) {
            socket.emit(event, data);
        }
    }
}