import { Socket } from "socket.io";
import { room } from "..";
import {
  ClientToServerEvents,
  ServerToClientEvents,
  IJoinRoom,
} from "@interfaces/index";

export const roomHandler = (
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
  io: any
) => {
  const socketId = socket.id;

  const joinRoom = ({ roomNum, nickname, texture, x, y }: IJoinRoom) => {
    if (!room[roomNum]) {
      room[roomNum] = {
        users: {},
        video: new Map(),
        chair: new Set(),
      };
    }

    const newUser = {
      nickname,
      texture,
      x,
      y,
    };

    room[roomNum].users[socketId] = newUser;

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
      Object.entries(room[roomNum].users).map(([key, value]) => ({
        ...value,
        socketId: key,
      }))
    );

    // 나의 정보를 나를 제외한 모두에게 전송
    socket.broadcast
      .to(roomNum)
      .emit("serverPlayerInfo", { ...newUser, socketId });

    // 누군가 앉아있는 의자들 목록 알려주기
    if (room[roomNum].chair) {
      io.to(socketId).emit(
        "serverOccupiedChairs",
        Array.from(room[roomNum].chair)
      );
    }

    socket.on("disconnect", () => {
      delete room[roomNum].users[socketId];

      io.to(roomNum).emit("serverLeaveRoom", socketId);
    });
  };

  socket.on("clientJoinRoom", joinRoom);
};
