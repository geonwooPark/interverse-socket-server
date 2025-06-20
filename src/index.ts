import "./module-alias";
import express from "express";
import http from "http";
import { Server, Socket } from "socket.io";
import cors from "cors";
import { roomHandler } from "@handlers/room";
import { chairHandler } from "@handlers/chair";
import { chatHandler } from "@handlers/chat";
import { playHandler } from "@handlers/play";
import { dmHandler } from "@handlers/dm";
import { videoHandler } from "@handlers/video";
import { ClientToServerEvents, ServerToClientEvents } from "@interfaces/index";

const app = express();

app.use(cors());

const server = http.createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "https://interverse.site",
    ],
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

    socket.on("disconnecting", () => {
      console.log("유저 연결 끊김..");
    });
  }
);

server.listen(8001, () => {
  console.log("서버 실행중...");
});
