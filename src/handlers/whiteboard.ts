import { Socket } from "socket.io";
import {
  IWhiteboardAction,
  ClientToServerEvents,
  ServerToClientEvents,
} from "@interfaces/index";

export const whiteboardHandler = (
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
  io: any
) => {
  const sendWhiteboardDraw = (action: IWhiteboardAction) => {
    if (!action.roomNum) return;

    socket.broadcast
      .to(action.roomNum)
      .emit("serverWhiteboardDraw", action.draw);
  };

  socket.on("clientWhiteboardDraw", sendWhiteboardDraw);
};
