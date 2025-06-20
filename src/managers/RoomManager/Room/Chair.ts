export class Chair {
  private list: Set<string> = new Set();

  get() {
    return new Set(this.list);
  }

  sit(userId: string) {
    this.list.add(userId);
  }

  leave(userId: string) {
    this.list.delete(userId);
  }
}
