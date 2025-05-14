"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dmHandler = void 0;
const dmHandler = (socket, io) => {
    const socketId = socket.id;
    const sendDM = (dm) => {
        io.to(dm.receiverId).emit("serverDM", Object.assign(Object.assign({}, dm), { socketId }));
    };
    socket.on("clientDM", sendDM);
};
exports.dmHandler = dmHandler;
