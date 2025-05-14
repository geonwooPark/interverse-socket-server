"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roomHandler = void 0;
const __1 = require("..");
const roomHandler = (socket, io) => {
    const socketId = socket.id;
    const joinRoom = ({ roomNum, nickname, texture, x, y }) => {
        if (!__1.room[roomNum]) {
            __1.room[roomNum] = {
                users: {},
                video: new Map(),
                chair: new Set(),
            };
        }
        const newUser = {
            nickname,
            texture,
            x,
            y,
        };
        __1.room[roomNum].users[socketId] = newUser;
        // 방에 입장시키기
        socket.join(roomNum);
        // 방 입장 메시지 보내기
        io.to(roomNum).emit("serverChat", {
            id: "",
            sender: "",
            message: `${nickname}님이 입장했습니다.`,
            roomNum,
            socketId: "",
        });
        // 다른 사람들의 정보를 나에게 전송
        io.to(socketId).emit("serverRoomMember", Object.entries(__1.room[roomNum].users).map(([key, value]) => (Object.assign(Object.assign({}, value), { socketId: key }))));
        // 나의 정보를 나를 제외한 모두에게 전송
        socket.broadcast
            .to(roomNum)
            .emit("serverPlayerInfo", Object.assign(Object.assign({}, newUser), { socketId }));
        // 누군가 앉아있는 의자들 목록 알려주기
        if (__1.room[roomNum].chair) {
            io.to(socketId).emit("serverOccupiedChairs", Array.from(__1.room[roomNum].chair));
        }
        socket.on("disconnect", () => {
            delete __1.room[roomNum].users[socketId];
            io.to(roomNum).emit("serverLeaveRoom", socketId);
        });
    };
    socket.on("clientJoinRoom", joinRoom);
};
exports.roomHandler = roomHandler;
