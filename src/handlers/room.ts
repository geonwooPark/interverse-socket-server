import { Socket } from "socket.io";
import {
  ClientToServerEvents,
  ServerToClientEvents,
  IJoinRoom,
} from "@interfaces/index";
import { RoomManager } from "@managers/RoomManager";

const roomManager = RoomManager.getInstance();

export const roomHandler = (
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
  io: any
) => {
  const socketId = socket.id;

  const joinRoom = ({ roomNum, nickname, texture, x, y }: IJoinRoom) => {
    const newUser = {
      nickname,
      texture,
      x,
      y,
    };

    const gameRoom = roomManager.get(roomNum);

    gameRoom.participants.join({ userId: socketId, data: newUser });

    // 방에 입장시키기
    socket.join(roomNum);

    // 방 입장 메시지 보내기
    io.to(roomNum).emit("serverChat", {
      id: "",
      sender: "",
      message: `${nickname}님이 입장했습니다.`,
      roomNum,
      socketId: "",
    });

    // 다른 사람들의 정보를 나에게 전송
    io.to(socketId).emit(
      "serverRoomMember",
      Array.from(gameRoom.participants.getUserList()).map(([key, value]) => ({
        ...value,
        socketId: key,
      }))
    );

    // 나의 정보를 나를 제외한 모두에게 전송
    socket.broadcast
      .to(roomNum)
      .emit("serverPlayerInfo", { ...newUser, socketId });

    // 누군가 앉아있는 의자들 목록 알려주기
    if (gameRoom.chair.get().size > 0) {
      io.to(socketId).emit(
        "serverOccupiedChairs",
        Array.from(gameRoom.chair.get())
      );
    }

    socket.on("disconnect", () => {
      const gameRoom = roomManager.get(roomNum);

      gameRoom.participants.leave(socketId);

      io.to(roomNum).emit("serverLeaveRoom", socketId);
    });
  };

  socket.on("clientJoinRoom", joinRoom);
};
