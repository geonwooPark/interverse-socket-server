import { RedisManager } from "@db/redis";
import type { ParticipantData } from "@managers/RoomManager";

const PREFIX = "room";
const KEY = (roomId: string) => `${PREFIX}:${roomId}:participants`;

export class RoomParticipantsStore {
  private static instance: RoomParticipantsStore;

  private constructor() {}

  public static getInstance(): RoomParticipantsStore {
    if (!RoomParticipantsStore.instance) {
      RoomParticipantsStore.instance = new RoomParticipantsStore();
    }
    return RoomParticipantsStore.instance;
  }

  private get client() {
    return RedisManager.getInstance().getClient();
  }

  async load(roomId: string): Promise<Record<string, ParticipantData>> {
    try {
      const json = await this.client.get(KEY(roomId));
      return json ? (JSON.parse(json) as Record<string, ParticipantData>) : {};
    } catch (e) {
      console.error("[RoomParticipantsStore] load error", e);
      return {};
    }
  }

  async save(
    roomId: string,
    participants: Map<string, ParticipantData>,
  ): Promise<void> {
    const obj: Record<string, ParticipantData> = {};
    participants.forEach((v, k) => {
      obj[k] = v;
    });
    await this.client.set(KEY(roomId), JSON.stringify(obj));
  }

  async delete(roomId: string): Promise<void> {
    await this.client.del(KEY(roomId));
  }
}
