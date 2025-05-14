"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chairHandler = void 0;
const __1 = require("..");
const chairHandler = (socket, io) => {
    const sendChairId = ({ roomNum, chairId }) => {
        if (__1.room[roomNum].chair.has(chairId)) {
            __1.room[roomNum].chair.delete(chairId);
        }
        else {
            __1.room[roomNum].chair.add(chairId);
        }
        socket.broadcast.to(roomNum).emit("serverChairId", chairId);
        socket.on("disconnect", () => {
            if (__1.room[roomNum].chair.has(chairId)) {
                __1.room[roomNum].chair.delete(chairId);
                io.to(roomNum).emit("serverChairId", chairId);
            }
        });
    };
    socket.on("clientChairId", sendChairId);
};
exports.chairHandler = chairHandler;
