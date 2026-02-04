/** 방 참가자 스냅샷 (저장/복원용) */
export interface ParticipantData {
  nickname: string;
  texture: string;
  x: number;
  y: number;
}

/** 화이트보드 드로우 (저장/복원용) */
export interface WhiteboardDraw {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  color: string;
  lineWidth: number;
  type: "draw" | "clear";
}

/** 방 전체 상태 스냅샷 (저장소 load/save용) */
export interface RoomStateSnapshot {
  participants: Record<string, ParticipantData>;
  chairs: string[];
  whiteboard: WhiteboardDraw[];
}
