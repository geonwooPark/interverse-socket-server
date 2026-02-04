export interface IWhiteboardDraw {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  color: string;
  lineWidth: number;
  type: "draw" | "clear";
}

export class Whiteboard {
  private draws: IWhiteboardDraw[] = [];

  getDraws(): IWhiteboardDraw[] {
    return [...this.draws];
  }

  addDraw(draw: IWhiteboardDraw) {
    if (draw.type === "clear") {
      this.draws = [];
    } else {
      this.draws.push(draw);
    }
  }

  clear() {
    this.draws = [];
  }

  /** Redis 등 외부 저장소에서 복원할 때 사용 */
  setDraws(draws: IWhiteboardDraw[]) {
    this.draws = [...draws];
  }
}
