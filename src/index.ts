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
import {
  ClientToServerEvents,
  IRoomUser,
  ServerToClientEvents,
} from "@interfaces/index";
import * as mediasoup from "mediasoup";

const app = express();

app.use(cors());

const server = http.createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
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

export const room: Record<
  string,
  {
    users: IRoomUser;
    video: Map<
      string,
      {
        transport: mediasoup.types.WebRtcTransport;
        producers?: mediasoup.types.Producer[];
        consumers?: mediasoup.types.Consumer[];
      }
    >;
    chair: Set<string>;
  }
> = {};

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
