import { RedisManager } from "@db/redis";

const PREFIX = "room";
const KEY = (roomId: string) => `${PREFIX}:${roomId}:chairs`;

export class RoomChairStore {
  private static instance: RoomChairStore;

  private constructor() {}

  public static getInstance(): RoomChairStore {
    if (!RoomChairStore.instance) {
      RoomChairStore.instance = new RoomChairStore();
    }
    return RoomChairStore.instance;
  }

  private get client() {
    return RedisManager.getInstance().getClient();
  }

  async load(roomId: string): Promise<string[]> {
    try {
      const members = await this.client.smembers(KEY(roomId));

      return members;
    } catch (e) {
      console.error("[RoomChairStore] load error", e);
      return [];
    }
  }

  async save(roomId: string, chairIds: Set<string>): Promise<void> {
    const key = KEY(roomId);

    await this.client.del(key);

    const ids = Array.from(chairIds);

    if (ids.length > 0) {
      await this.client.sadd(key, ...ids);
    }
  }

  async delete(roomId: string): Promise<void> {
    await this.client.del(KEY(roomId));
  }
}
