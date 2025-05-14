import { Socket } from "socket.io";
import {
  IChair,
  ClientToServerEvents,
  ServerToClientEvents,
} from "@interfaces/index";
import { room } from "..";

export const chairHandler = (
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
  io: any
) => {
  const sendChairId = ({ roomNum, chairId }: IChair) => {
    if (room[roomNum].chair.has(chairId)) {
      room[roomNum].chair.delete(chairId);
    } else {
      room[roomNum].chair.add(chairId);
    }

    socket.broadcast.to(roomNum).emit("serverChairId", chairId);

    socket.on("disconnect", () => {
      if (room[roomNum].chair.has(chairId)) {
        room[roomNum].chair.delete(chairId);

        io.to(roomNum).emit("serverChairId", chairId);
      }
    });
  };

  socket.on("clientChairId", sendChairId);
};
