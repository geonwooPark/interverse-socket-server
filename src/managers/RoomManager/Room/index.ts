import { Chair } from "./Chair";
import { Participants } from "./Participate";
import { Video } from "./Video";
import { Whiteboard } from "./Whiteboard";

export class Room {
  roomId: string;
  participants: Participants;
  video: Video;
  chair: Chair;
  whiteboard: Whiteboard;

  constructor(roomId: string) {
    this.roomId = roomId;
    this.participants = new Participants();
    this.video = new Video();
    this.chair = new Chair();
    this.whiteboard = new Whiteboard();
  }
}
