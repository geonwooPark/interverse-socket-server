"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.room = void 0;
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const room_1 = require("@handlers/room");
const chair_1 = require("@handlers/chair");
const chat_1 = require("@handlers/chat");
const play_1 = require("@handlers/play");
const dm_1 = require("@handlers/dm");
const video_1 = require("@handlers/video");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "https://www.interverse.kr",
        ],
        methods: ["GET", "POST"],
        credentials: true,
    },
});
exports.room = {};
io.on("connection", (socket) => {
    (0, room_1.roomHandler)(socket, io);
    (0, play_1.playHandler)(socket, io);
    (0, chat_1.chatHandler)(socket, io);
    (0, chair_1.chairHandler)(socket, io);
    (0, dm_1.dmHandler)(socket, io);
    (0, video_1.videoHandler)(socket, io);
    socket.on("disconnecting", () => {
        console.log("유저 연결 끊김..");
    });
});
server.listen(8001, () => {
    console.log("서버 실행중...");
});
