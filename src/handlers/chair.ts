import { Socket } from "socket.io";
import {
  IChair,
  ClientToServerEvents,
  ServerToClientEvents,
} from "@interfaces/index";
import { RoomManager } from "@managers/RoomManager";

const roomManager = RoomManager.getInstance();

export const chairHandler = (
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
  io: any,
) => {
  const sendChairId = ({ roomNum, chairId }: IChair) => {
    const gameRoom = roomManager.get(roomNum);

    if (gameRoom.chair.get().has(chairId)) {
      gameRoom.chair.leave(chairId);
    } else {
      gameRoom.chair.sit(chairId);
    }

    socket.broadcast.to(roomNum).emit("serverChairId", chairId);

    // Redis에 실시간 상태 저장
    roomManager
      .persistRoom(roomNum)
      .catch((e) => console.error("[chairHandler] persistRoom error", e));

    socket.on("disconnect", () => {
      if (gameRoom.chair.get().has(chairId)) {
        gameRoom.chair.leave(chairId);

        io.to(roomNum).emit("serverChairId", chairId);
        roomManager
          .persistRoom(roomNum)
          .catch((e) => console.error("[chairHandler] persistRoom error", e));
      }
    });
  };

  socket.on("clientChairId", sendChairId);
};
