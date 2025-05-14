"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.playHandler = void 0;
const __1 = require("..");
const playHandler = (socket, io) => {
    const socketId = socket.id;
    const sendAvatarPosition = (avatarPosition) => {
        socket.broadcast.to(avatarPosition.roomNum).emit("serverAvatarPosition", Object.assign(Object.assign({}, avatarPosition), { socketId }));
        if (avatarPosition.isLast) {
            if (__1.room[avatarPosition.roomNum].users[socketId]) {
                // 위치 업데이트
                __1.room[avatarPosition.roomNum].users[socketId].x = avatarPosition.x;
                __1.room[avatarPosition.roomNum].users[socketId].y = avatarPosition.y;
                __1.room[avatarPosition.roomNum].users[socketId].texture =
                    avatarPosition.animation;
            }
        }
    };
    socket.on("clientAvatarPosition", sendAvatarPosition);
};
exports.playHandler = playHandler;
