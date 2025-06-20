import * as mediasoup from "mediasoup";

export class Video {
  private list: Map<
    string,
    {
      transport: mediasoup.types.WebRtcTransport;
      producers?: mediasoup.types.Producer[];
      consumers?: mediasoup.types.Consumer[];
    }
  > = new Map();

  getVideoList() {
    return new Map(this.list);
  }

  getSingleVideo(userId: string) {
    return new Map(this.list).get(userId);
  }

  hasVideo(userId: string): boolean {
    return this.list.has(userId);
  }

  join({
    userId,
    data,
  }: {
    userId: string;
    data: {
      transport: mediasoup.types.WebRtcTransport;
      producers?: mediasoup.types.Producer[];
      consumers?: mediasoup.types.Consumer[];
    };
  }) {
    if (this.hasVideo(userId)) return;

    this.list.set(userId, data);
  }

  leave(userId: string) {
    this.list.delete(userId);
  }
}
