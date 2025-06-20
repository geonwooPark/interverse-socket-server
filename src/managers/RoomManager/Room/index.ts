import { Chair } from "./Chair";
import { Participants } from "./Participate";
import { Video } from "./Video";

export class Room {
  roomId: string;
  participants: Participants;
  video: Video;
  chair: Chair;

  constructor(roomId: string) {
    this.roomId = roomId;
    this.participants = new Participants();
    this.video = new Video();
    this.chair = new Chair();
  }
}
