import { RoomChairStore } from "./ChairStore";
import { RoomParticipantsStore } from "./ParticipantsStore";
import { RoomWhiteboardStore } from "./WhiteboardStore";
import type { RoomStateSnapshot } from "@managers/RoomManager";

const chairStore = RoomChairStore.getInstance();
const participantsStore = RoomParticipantsStore.getInstance();
const whiteboardStore = RoomWhiteboardStore.getInstance();

/** 방 상태 저장소 (Redis 구현). load/save/delete 담당 */
export class RoomStateRepository {
  private static instance: RoomStateRepository;

  private constructor() {}

  public static getInstance(): RoomStateRepository {
    if (!RoomStateRepository.instance) {
      RoomStateRepository.instance = new RoomStateRepository();
    }
    return RoomStateRepository.instance;
  }

  async loadRoomState(roomId: string): Promise<RoomStateSnapshot | null> {
    try {
      const [participants, chairs, whiteboard] = await Promise.all([
        participantsStore.load(roomId),
        chairStore.load(roomId),
        whiteboardStore.load(roomId),
      ]);
      return { participants, chairs, whiteboard };
    } catch (e) {
      console.error("[RoomStateRepository] loadRoomState error", e);
      return null;
    }
  }

  async saveRoomState(
    roomId: string,
    snapshot: RoomStateSnapshot,
  ): Promise<void> {
    try {
      await Promise.all([
        participantsStore.save(
          roomId,
          new Map(Object.entries(snapshot.participants)),
        ),
        chairStore.save(roomId, new Set(snapshot.chairs)),
        whiteboardStore.save(roomId, snapshot.whiteboard),
      ]);
    } catch (e) {
      console.error("[RoomStateRepository] saveRoomState error", e);
    }
  }

  async deleteRoomState(roomId: string): Promise<void> {
    await Promise.all([
      participantsStore.delete(roomId),
      chairStore.delete(roomId),
      whiteboardStore.delete(roomId),
    ]);
  }
}
