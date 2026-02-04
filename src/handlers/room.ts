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
  io: any,
) => {
  const socketId = socket.id;

  const broadcastParticipantCount = (
    io: any,
    roomNum: string,
    gameRoom: ReturnType<typeof roomManager.get>,
  ) => {
    const participantCount = gameRoom.participants.getUserList().size;
    io.emit("serverRoomParticipantCount", {
      roomId: roomNum,
      participantCount,
    });
  };

  const joinRoom = async ({ roomNum, nickname, texture, x, y }: IJoinRoom) => {
    const newUser = {
      nickname,
      texture,
      x,
      y,
    };

    const gameRoom = await roomManager.getAsync(roomNum);

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
      })),
    );

    // 나의 정보를 나를 제외한 모두에게 전송
    socket.broadcast
      .to(roomNum)
      .emit("serverPlayerInfo", { ...newUser, socketId });

    // 누군가 앉아있는 의자들 목록 알려주기
    if (gameRoom.chair.get().size > 0) {
      io.to(socketId).emit(
        "serverOccupiedChairs",
        Array.from(gameRoom.chair.get()),
      );
    }

    // 참여자 수 브로드캐스트 (모든 클라이언트에게)
    broadcastParticipantCount(io, roomNum, gameRoom);

    // Redis에 실시간 상태 저장
    roomManager
      .persistRoom(roomNum)
      .catch((e) => console.error("[roomHandler] persistRoom error", e));
  };

  // disconnect 이벤트를 roomHandler 레벨에서 처리
  socket.on("disconnect", () => {
    const rooms = roomManager.findRoomsBySocketId(socketId);

    // 모든 참여 중인 방에서 나가기
    rooms.forEach((gameRoom) => {
      gameRoom.participants.leave(socketId);

      io.to(gameRoom.roomId).emit("serverLeaveRoom", socketId);

      // 참여자 수 브로드캐스트 (퇴장 후)
      broadcastParticipantCount(io, gameRoom.roomId, gameRoom);

      // Redis에 실시간 상태 저장
      roomManager
        .persistRoom(gameRoom.roomId)
        .catch((e) => console.error("[roomHandler] persistRoom error", e));
    });
  });

  // 방 목록의 참여자 수 요청 처리
  const requestRoomParticipantCounts = (roomIds: string[]) => {
    const counts = roomIds.map((roomId) => {
      const gameRoom = roomManager.get(roomId);
      const participantCount = gameRoom.participants.getUserList().size;
      return {
        roomId,
        participantCount,
      };
    });
  };

  socket.on("clientJoinRoom", joinRoom);
};
