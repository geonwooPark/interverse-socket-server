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
      const json = await this.client.get(KEY(roomId));
      return json ? (JSON.parse(json) as string[]) : [];
    } catch (e) {
      console.error("[RoomChairStore] load error", e);
      return [];
    }
  }

  async save(roomId: string, chairIds: Set<string>): Promise<void> {
    await this.client.set(KEY(roomId), JSON.stringify(Array.from(chairIds)));
  }

  async delete(roomId: string): Promise<void> {
    await this.client.del(KEY(roomId));
  }
}
