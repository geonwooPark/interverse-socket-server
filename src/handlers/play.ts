import { Socket } from "socket.io";
import {
  ClientToServerEvents,
  ServerToClientEvents,
  IAvatarPosition,
} from "@interfaces/index";
import { RoomManager } from "src/managers/RoomManager";

const roomManager = RoomManager.getInstance();

export const playHandler = (
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
  io: any
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
      }
    }
  };

  socket.on("clientAvatarPosition", sendAvatarPosition);
};
