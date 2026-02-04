import { Chair } from "./Chair";
import { Participants } from "./Participate";
import { Video } from "./Video";
import { Whiteboard } from "./Whiteboard";
import type { RoomStateSnapshot } from "../types";

export class Room {
  roomId: string;
  participants: Participants;
  video: Video;
  chair: Chair;
  whiteboard: Whiteboard;

  constructor(roomId: string) {
    this.roomId = roomId;
    this.participants = new Participants();
    this.video = new Video();
    this.chair = new Chair();
    this.whiteboard = new Whiteboard();
  }

  /** Redis 등에서 불러온 상태로 복원 */
  hydrateFromState(snapshot: RoomStateSnapshot): void {
    Object.entries(snapshot.participants).forEach(([userId, data]) => {
      this.participants.join({ userId, data });
    });
    snapshot.chairs.forEach((chairId) => this.chair.sit(chairId));
    if (snapshot.whiteboard.length > 0) {
      this.whiteboard.setDraws(snapshot.whiteboard);
    }
  }

  /** 현재 방 상태 스냅샷 생성 (Redis 저장용) */
  toStateSnapshot(): RoomStateSnapshot {
    const participants: Record<
      string,
      { nickname: string; texture: string; x: number; y: number }
    > = {};
    this.participants.getUserList().forEach((data, socketId) => {
      participants[socketId] = data;
    });
    return {
      participants,
      chairs: Array.from(this.chair.get()),
      whiteboard: this.whiteboard.getDraws(),
    };
  }
}
