"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatHandler = void 0;
const chatHandler = (socket, io) => {
    const socketId = socket.id;
    const sendChat = (chat) => {
        if (!chat.roomNum)
            return;
        io.to(chat.roomNum).emit("serverChat", Object.assign(Object.assign({}, chat), { socketId }));
    };
    socket.on("clientChat", sendChat);
};
exports.chatHandler = chatHandler;
