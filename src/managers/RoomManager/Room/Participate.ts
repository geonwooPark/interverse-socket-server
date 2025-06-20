export class Participants {
  private list: Map<
    string,
    {
      nickname: string;
      texture: string;
      x: number;
      y: number;
    }
  > = new Map();

  getUserList() {
    return new Map(this.list);
  }

  getSingleUser(userId: string) {
    return new Map(this.list).get(userId);
  }

  hasUser(userId: string): boolean {
    return this.list.has(userId);
  }

  join({
    userId,
    data,
  }: {
    userId: string;
    data: {
      nickname: string;
      texture: string;
      x: number;
      y: number;
    };
  }) {
    if (this.hasUser(userId)) return;

    this.list.set(userId, data);
  }

  leave(userId: string) {
    this.list.delete(userId);
  }

  updatePosition({
    userId,
    userData,
  }: {
    userId: string;
    userData: {
      nickname: string;
      texture: string;
      x: number;
      y: number;
    };
  }) {
    if (!this.list.has(userId)) return;

    this.list.set(userId, {
      ...this.list.get(userId),
      texture: userData.texture,
      x: userData.x,
      y: userData.y,
    });
  }
}
