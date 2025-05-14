import { Socket } from "socket.io";
import {
  IChat,
  ClientToServerEvents,
  ServerToClientEvents,
} from "@interfaces/index";

export const chatHandler = (
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
  io: any
) => {
  const socketId = socket.id;

  const sendChat = (chat: IChat) => {
    if (!chat.roomNum) return;

    io.to(chat.roomNum).emit("serverChat", {
      ...chat,
      socketId,
    });
  };

  socket.on("clientChat", sendChat);
};
