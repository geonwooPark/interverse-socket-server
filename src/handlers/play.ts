import { Socket } from "socket.io";
import { room } from "..";
import {
  ClientToServerEvents,
  ServerToClientEvents,
  IAvatarPosition,
} from "@interfaces/index";

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

    if (avatarPosition.isLast) {
      if (room[avatarPosition.roomNum].users[socketId]) {
        // 위치 업데이트
        room[avatarPosition.roomNum].users[socketId].x = avatarPosition.x;
        room[avatarPosition.roomNum].users[socketId].y = avatarPosition.y;
        room[avatarPosition.roomNum].users[socketId].texture =
          avatarPosition.animation;
      }
    }
  };

  socket.on("clientAvatarPosition", sendAvatarPosition);
};
