import { Socket } from "socket.io";
import {
  ClientToServerEvents,
  IDirectMessage,
  ServerToClientEvents,
} from "@interfaces/index";

export const dmHandler = (
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
  io: any
) => {
  const socketId = socket.id;

  const sendDM = (dm: IDirectMessage) => {
    io.to(dm.receiverId).emit("serverDM", { ...dm, socketId });
  };

  socket.on("clientDM", sendDM);
};
