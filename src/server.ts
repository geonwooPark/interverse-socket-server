import { createServer } from "http";
import { Server, Socket } from "socket.io";

import { RedisManager } from "@db/redis";
import { roomHandler } from "@handlers/room";
import { chairHandler } from "@handlers/chair";
import { chatHandler } from "@handlers/chat";
import { playHandler } from "@handlers/play";
import { dmHandler } from "@handlers/dm";
import { videoHandler } from "@handlers/video";
import { whiteboardHandler } from "@handlers/whiteboard";
import { ClientToServerEvents, ServerToClientEvents } from "@interfaces/index";

export const PORT = Number(process.env.PORT) || 8001;

export function createSocketServer() {
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
    },
  );

  return { server, io };
}

export async function connectRedis(): Promise<void> {
  try {
    await RedisManager.getInstance().connect();
    console.log("[Redis] 연결됨");
  } catch (e) {
    console.warn("[Redis] 연결 실패. Redis 없이 메모리만 사용합니다.", e);
  }
}

export async function gracefulShutdown(): Promise<void> {
  await RedisManager.getInstance().close();
  process.exit(0);
}
