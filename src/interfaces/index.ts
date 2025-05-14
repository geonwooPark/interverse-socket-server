export interface IRoom {
  roomNum: string;
  role: "host" | "guest";
  title: string;
  createAt: number;
  headCount?: number;
}

export interface IRoomUser {
  [socketId: string]: {
    nickname: string;
    texture: string;
    x: number;
    y: number;
  };
}

export interface IRoomUserDto {
  nickname: string;
  texture: string;
  x: number;
  y: number;
  socketId: string;
}

export interface IChat {
  id: string;
  sender: string;
  message: string;
  roomNum: string;
  socketId?: string;
}

export interface IDirectMessage {
  id: string;
  sender: string;
  message: string;
  roomNum: string;
  receiverId: string;
  socketId?: string;
}

export interface IJoinRoom {
  roomNum: string;
  nickname: string;
  texture: string;
  x: number;
  y: number;
  headCount?: number;
}

export interface IAvatarPosition {
  x: number;
  y: number;
  animation: any;
  socketId?: string;
  roomNum?: string;
  isLast?: boolean;
}

export interface IChair {
  roomNum: string;
  chairId: string;
}

export interface IVideoRoomUser {
  [socketId: string]: {
    nickname: string;
    texture: string;
    isVideoEnabled: boolean;
    isAudioEnabled: boolean;
  };
}

export interface ServerToClientEvents {
  serverLeaveRoom: (sockerId: string) => void;
  serverChat: (chat: IChat) => void;
  serverPlayerInfo: (roomUser: IRoomUserDto) => void;
  serverAvatarPosition: ({
    x,
    y,
    animation,
    socketId,
  }: IAvatarPosition) => void;
  serverLeaveVideoRoom: () => void;
  serverOccupiedChairs: (chairs: string[]) => void;
  serverChairId: (chairId: string) => void;
  serverRoomMember: (users: IRoomUserDto[]) => void;
  serverDM: (dm: IDirectMessage) => void;
  serverRtpCapabilities: (
    rtpCapabilities: mediasoup.types.RtpCapabilities
  ) => void;
  serverSendTransportCreated: (transport: any) => void;
  serverProduced: ({ id }: { id: string }) => void;
  serverRecvTransportCreated: ({
    id,
    iceParameters,
    iceCandidates,
    dtlsParameters,
  }: {
    id: string;
    iceParameters: mediasoupClient.types.IceParameters;
    iceCandidates: mediasoupClient.types.IceCandidate[];
    dtlsParameters: mediasoupClient.types.DtlsParameters;
  }) => void;
  serverExistingProducers: (producers: any) => void;
  serverNewProducer: ({
    producerId,
    consumerId,
    kind,
    rtpParameters,
  }: {
    producerId: string;
    consumerId: string;
    kind: "audio" | "video";
    rtpParameters: mediasoupClient.types.RtpParameters;
  }) => void;
  serverExceedHeadCount: ({ message }: { message: string }) => void;
}

export interface ClientToServerEvents {
  clientJoinRoom: (params: IJoinRoom) => void;
  clientChat: (chat: IChat) => void;
  clientAvatarPosition: ({ x, y, roomNum, animation }: IAvatarPosition) => void;
  clientChairId: ({ roomNum, chairId }: IChair) => void;
  clientDM: (dm: IDirectMessage) => void;
  clientJoinVideoRoom: (roomNum: string) => void;
  clientLeaveVideoRoom: (roomNum: string) => void;
  clientCreateSendTransport: (roomNum: string) => void;
  clientConnectTransport: ({
    roomNum,
    dtlsParameters,
  }: {
    roomNum: string;
    dtlsParameters: mediasoupClient.types.DtlsParameters;
  }) => Promise<void>;
  clientProduce: ({
    roomNum,
    kind,
    rtpParameters,
    rtpCapabilities,
  }: {
    roomNum: string;
    kind: "audio" | "video";
    rtpCapabilities: any;
    rtpParameters: mediasoupClient.types.RtpParameters;
  }) => Promise<void>;
  clientConnectRecvTransport: ({
    roomNum,
    dtlsParameters,
  }: {
    roomNum: string;
    dtlsParameters: mediasoupClient.types.DtlsParameters;
  }) => void;
  clientCreateRecvTransport: (roomNum: string) => void;
  clientRequestProducers: ({
    roomNum,
    rtpCapabilities,
  }: {
    roomNum: string;
    rtpCapabilities: mediasoup.types.RtpCapabilities;
  }) => void;
  clientResumeConsumer: ({
    roomNum,
    consumerId,
  }: {
    roomNum: string;
    consumerId: string;
  }) => void;
}
