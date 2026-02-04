import { Room } from "./Room";
import { RoomStateRepository } from "@repositories/RoomStateRepository";

export type {
  RoomStateSnapshot,
  ParticipantData,
  WhiteboardDraw,
} from "./types";

const roomStateRepo = RoomStateRepository.getInstance();

export class RoomManager {
  private static instance: RoomManager;
  private rooms = new Map<string, Room>();

  private constructor() {}

  public static getInstance(): RoomManager {
    if (!RoomManager.instance) {
      RoomManager.instance = new RoomManager();
    }
    return RoomManager.instance;
  }

  /** 방 조회 (동기). 이미 메모리에 있으면 반환, 없으면 새로 생성만 함. Redis 복원이 필요하면 getAsync 사용 */
  public get(roomId: string): Room {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Room(roomId));
    }
    return this.rooms.get(roomId)!;
  }

  /** 방 조회 + Redis에서 상태 복원. 입장 등 방 최초 사용 시 호출 */
  public async getAsync(roomId: string): Promise<Room> {
    let room = this.rooms.get(roomId);
    if (!room) {
      room = new Room(roomId);
      this.rooms.set(roomId, room);
      try {
        const snapshot = await roomStateRepo.loadRoomState(roomId);
        if (
          snapshot &&
          (Object.keys(snapshot.participants).length > 0 ||
            snapshot.chairs.length > 0 ||
            snapshot.whiteboard.length > 0)
        ) {
          room.hydrateFromState(snapshot);
        }
      } catch (e) {
        console.error("[RoomManager] hydrateRoomFromRedis error", e);
      }
    }
    return room;
  }

  /** 방 상태를 Redis에 저장 (실시간 상태 동기화) */
  public async persistRoom(roomId: string): Promise<void> {
    const room = this.rooms.get(roomId);
    if (!room) return;
    await roomStateRepo.saveRoomState(roomId, room.toStateSnapshot());
  }

  public delete(roomId: string): void {
    this.rooms.delete(roomId);
    roomStateRepo
      .deleteRoomState(roomId)
      .catch((e) => console.error("[RoomManager] deleteRoomState error", e));
  }

  public findRoomsBySocketId(socketId: string): Room[] {
    const rooms: Room[] = [];
    for (const [, room] of this.rooms) {
      if (room.participants.hasUser(socketId)) {
        rooms.push(room);
      }
    }
    return rooms;
  }
}
