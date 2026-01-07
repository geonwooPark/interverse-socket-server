import { Socket } from "socket.io";
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@interfaces/index";
import { RoomManager } from "@managers/RoomManager";

const roomManager = RoomManager.getInstance();

export const whiteboardHandler = (
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
  io: any
) => {
  // 화이트보드 그리기 데이터 전송
  const sendWhiteboardDraw = ({
    roomNum,
    draw,
  }: {
    roomNum: string;
    draw: {
      x: number;
      y: number;
      prevX: number;
      prevY: number;
      color: string;
      lineWidth: number;
      type: "draw" | "clear";
    };
  }) => {
    // 서버 메모리에 저장
    const room = roomManager.get(roomNum);
    room.whiteboard.addDraw(draw);

    // 다른 클라이언트에게 브로드캐스트
    socket.broadcast.to(roomNum).emit("serverWhiteboardDraw", draw);
  };

  // 화이트보드 클리어 전송
  const sendWhiteboardClear = ({ roomNum }: { roomNum: string }) => {
    // 서버 메모리에서 클리어
    const room = roomManager.get(roomNum);
    room.whiteboard.clear();

    // 다른 클라이언트에게 브로드캐스트
    socket.broadcast.to(roomNum).emit("serverWhiteboardClear");
  };

  // 저장된 화이트보드 데이터 요청
  const requestWhiteboardData = ({ roomNum }: { roomNum: string }) => {
    const room = roomManager.get(roomNum);
    const draws = room.whiteboard.getDraws();
    io.to(socket.id).emit("serverWhiteboardData", draws);
  };

  socket.on("clientWhiteboardDraw", sendWhiteboardDraw);
  socket.on("clientWhiteboardClear", sendWhiteboardClear);
  socket.on("clientRequestWhiteboardData", requestWhiteboardData);
};

