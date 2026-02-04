import { RedisManager } from "@db/redis";
import type { WhiteboardDraw } from "@managers/RoomManager";

const PREFIX = "room";
const KEY = (roomId: string) => `${PREFIX}:${roomId}:whiteboard`;

export class RoomWhiteboardStore {
  private static instance: RoomWhiteboardStore;

  private constructor() {}

  public static getInstance(): RoomWhiteboardStore {
    if (!RoomWhiteboardStore.instance) {
      RoomWhiteboardStore.instance = new RoomWhiteboardStore();
    }
    return RoomWhiteboardStore.instance;
  }

  private get client() {
    return RedisManager.getInstance().getClient();
  }

  async load(roomId: string): Promise<WhiteboardDraw[]> {
    try {
      const json = await this.client.get(KEY(roomId));
      return json ? (JSON.parse(json) as WhiteboardDraw[]) : [];
    } catch (e) {
      console.error("[RoomWhiteboardStore] load error", e);
      return [];
    }
  }

  async save(roomId: string, draws: WhiteboardDraw[]): Promise<void> {
    await this.client.set(KEY(roomId), JSON.stringify(draws));
  }

  async delete(roomId: string): Promise<void> {
    await this.client.del(KEY(roomId));
  }
}
