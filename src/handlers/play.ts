import { Socket } from "socket.io";
import {
  ClientToServerEvents,
  ServerToClientEvents,
  IAvatarPosition,
} from "@interfaces/index";
import { RoomManager } from "@managers/RoomManager";

const roomManager = RoomManager.getInstance();

export const playHandler = (
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
  io: any,
) => {
  const socketId = socket.id;

  const sendAvatarPosition = (avatarPosition: IAvatarPosition) => {
    socket.broadcast.to(avatarPosition.roomNum).emit("serverAvatarPosition", {
      ...avatarPosition,
      socketId,
    });

    const gameRoom = roomManager.get(avatarPosition.roomNum);

    if (avatarPosition.isLast) {
      const target = gameRoom.participants.getSingleUser(socketId);

      if (target) {
        target.x = avatarPosition.x;
        target.y = avatarPosition.y;
        target.texture = avatarPosition.animation;
        // Redis에 실시간 상태 저장 (위치/텍스처)
        roomManager
          .persistRoom(avatarPosition.roomNum!)
          .catch((e) => console.error("[playHandler] persistRoom error", e));
      }
    }
  };

  socket.on("clientAvatarPosition", sendAvatarPosition);
};
