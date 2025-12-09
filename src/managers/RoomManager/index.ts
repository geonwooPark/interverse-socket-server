import { Room } from "./Room";

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

  public get(roomId: string): Room {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Room(roomId));
    }
    return this.rooms.get(roomId);
  }

  public delete(roomId: string) {
    this.rooms.delete(roomId);
  }

  public findRoomsBySocketId(socketId: string): Room[] {
    const rooms: Room[] = [];
    for (const [roomId, room] of this.rooms) {
      if (room.participants.hasUser(socketId)) {
        rooms.push(room);
      }
    }
    return rooms;
  }
}
