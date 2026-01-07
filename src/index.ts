import "./config/env";
import "./module-alias";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import { roomHandler } from "@handlers/room";
import { chairHandler } from "@handlers/chair";
import { chatHandler } from "@handlers/chat";
import { playHandler } from "@handlers/play";
import { dmHandler } from "@handlers/dm";
import { videoHandler } from "@handlers/video";
import { whiteboardHandler } from "@handlers/whiteboard";
import { ClientToServerEvents, ServerToClientEvents } from "@interfaces/index";

console.log("NODE_ENV =", process.env.NODE_ENV);

const server = createServer();

const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
  cors: {
    origin: [process.env.FRONTEND_URL],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on(
  "connection",
  (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
    roomHandler(socket, io);
    playHandler(socket, io);
    chatHandler(socket, io);
    chairHandler(socket, io);
    dmHandler(socket, io);
    videoHandler(socket, io);
    whiteboardHandler(socket, io);

    socket.on("disconnecting", () => {
      console.log("유저 연결 끊김...");
    });
  }
);

server.listen(process.env.PORT || 8001, () => {
  console.log("서버 실행중...");
});
