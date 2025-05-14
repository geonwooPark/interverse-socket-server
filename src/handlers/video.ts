import { Socket } from "socket.io";
import { ClientToServerEvents, ServerToClientEvents } from "@interfaces/index";
import * as mediasoup from "mediasoup";
import { Worker, Router } from "mediasoup/node/lib/types";
import { room } from "..";

let worker: Worker;
let router: Router;

const createWorkerAndRouter = async () => {
  if (!worker) {
    worker = await mediasoup.createWorker({
      rtcMinPort: 40000,
      rtcMaxPort: 49999,
    });
  }

  if (!router) {
    router = await worker.createRouter({
      mediaCodecs: [
        {
          kind: "audio",
          mimeType: "audio/opus",
          clockRate: 48000,
          channels: 2,
          parameters: {
            minptime: 10,
            useinbandfec: 1,
          },
        },
        {
          kind: "video",
          mimeType: "video/VP8",
          clockRate: 90000,
          parameters: {
            "x-google-max-bitrate": 2500,
            "x-google-min-bitrate": 500,
          },
        },
      ],
    });
  }
};

// 서버 시작 시 worker & router 생성
(async () => {
  await createWorkerAndRouter();
})();

export const videoHandler = (
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
  io: any
) => {
  // 비디오룸 참여 - 클라이언트에게 어떤 오디오 / 비디오 코덱을 지원하는지에 대한 정보를 전송
  const joinVideoRoom = async (roomNum: string) => {
    socket.join(`${roomNum}-video`);

    io.to(`${roomNum}-video`).emit(
      "serverRtpCapabilities",
      router.rtpCapabilities
    );
  };

  // 송신 Transport 생성
  const createSendTransport = async (roomNum: string) => {
    const transport = await router.createWebRtcTransport({
      listenIps: [{ ip: "127.0.0.1", announcedIp: null }], // 공인 IP 추가
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
    });

    // Transport 저장
    room[roomNum].video.set(socket.id, {
      transport,
      producers: [],
    });

    // Transport 연결 이벤트
    transport.on("dtlsstatechange", (state) => {
      if (state === "closed") {
        room[roomNum].video.delete(socket.id);
      }
    });

    socket.emit("serverSendTransportCreated", {
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
    });
  };

  // 송신 Transport 연결
  const connectTransport = async ({ roomNum, dtlsParameters }: any) => {
    const userData = room[roomNum].video.get(socket.id);
    if (!userData?.transport) return console.error("❌ Transport not found");

    await userData.transport.connect({ dtlsParameters });
    console.log(`✅ Transport connected: ${socket.id}`);
  };

  // 새로운 프로듀서 발생 시 처리
  const handleNewProducer = async ({
    roomNum,
    producerId,
    rtpCapabilities,
    ownerId,
  }: {
    roomNum: string;
    producerId: string;
    rtpCapabilities: any;
    ownerId: string;
  }) => {
    // 방의 모든 수신자(RecvTransport 보유자)에게 Consumer 생성
    for (const [socketId, userData] of room[roomNum].video) {
      if (!socketId.endsWith("-recv")) continue;

      try {
        const producer = room[roomNum].video
          .get(ownerId)
          ?.producers.find((p) => p.id === producerId);

        if (!producer) continue;

        const consumer = await userData.transport.consume({
          producerId,
          rtpCapabilities,
          paused: true,
        });

        userData.consumers ||= [];
        userData.consumers.push(consumer);
        room[roomNum].video.set(socketId, userData);

        // 해당 소켓에만 Consumer 정보 전송
        io.to(socketId.replace("-recv", "")).emit("serverNewProducer", {
          producerId,
          consumerId: consumer.id,
          kind: consumer.kind,
          rtpParameters: consumer.rtpParameters,
        });
      } catch (error) {
        console.error(`❌ [${socketId}] Consumer 생성 실패:`, error);
      }
    }
  };

  // 송신 프로듀서 생성
  const produce = async ({
    roomNum,
    kind,
    rtpParameters,
    rtpCapabilities,
  }: any) => {
    const userData = room[roomNum].video.get(socket.id);

    if (!userData || !userData.transport) return;

    const producer = await userData.transport.produce({ kind, rtpParameters });

    userData.producers.push(producer);

    room[roomNum].video.set(socket.id, userData);

    socket.emit("serverProduced", { id: producer.id });

    handleNewProducer({
      roomNum,
      producerId: producer.id,
      rtpCapabilities,
      ownerId: socket.id,
    });
  };

  // 수신 트랜스포트 생성
  const createRecvTransport = async (roomNum: string) => {
    const transport = await router.createWebRtcTransport({
      listenIps: [{ ip: "127.0.0.1", announcedIp: null }],
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
    });

    room[roomNum].video.set(`${socket.id}-recv`, { transport, consumers: [] });

    transport.on("dtlsstatechange", (state) => {
      if (state === "closed") {
        room[roomNum].video.delete(`${socket.id}-recv`);
      }
    });

    socket.emit("serverRecvTransportCreated", {
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
    });
  };

  // 수신 트랜스포트 연결
  const connectRecvTransport = async ({ roomNum, dtlsParameters }: any) => {
    const userData = room[roomNum].video.get(`${socket.id}-recv`);

    if (!userData?.transport) return;
    if (userData.transport.dtlsState !== "new") return;

    try {
      await userData.transport.connect({ dtlsParameters });
    } catch (error) {
      console.error(`❌ [${socket.id}] RecvTransport 연결 실패:`, error);
    }
  };

  // 기존 프로듀서 목록 전달
  const requestProducers = async ({
    roomNum,
    rtpCapabilities,
  }: {
    roomNum: string;
    rtpCapabilities: any;
  }) => {
    const recvData = room[roomNum].video.get(`${socket.id}-recv`);

    if (!recvData?.transport) {
      console.error("RecvTransport not found");
      return;
    }

    // 기존 Producer 수집
    const producers = Array.from(room[roomNum].video.entries())
      .filter(([id]) => !id.endsWith("-recv") && id !== socket.id)
      .flatMap(([, data]) => data.producers || []);

    // Consumer 생성
    const consumersInfo = await Promise.all(
      producers.map(async (producer) => {
        try {
          const consumer = await recvData.transport.consume({
            producerId: producer.id,
            rtpCapabilities,
            paused: true,
          });

          // Consumer 저장
          recvData.consumers = recvData.consumers || [];
          recvData.consumers.push(consumer);

          return {
            consumerId: consumer.id,
            producerId: producer.id,
            kind: consumer.kind,
            rtpParameters: consumer.rtpParameters,
          };
        } catch (error) {
          console.error(`Consumer 생성 실패 (${producer.id}):`, error);
          return null;
        }
      })
    );

    // 성공한 Consumer만 필터링
    socket.emit(
      "serverExistingProducers",
      consumersInfo.filter((info) => info !== null)
    );
  };

  // 컨슈머 재개
  const resumeConsumer = async ({
    roomNum,
    consumerId,
  }: {
    roomNum: string;
    consumerId: string;
  }) => {
    const userData = room[roomNum].video.get(`${socket.id}-recv`);

    if (!userData) return console.error("❌ RecvTransport not found");

    const consumer = userData.consumers.find((c) => c.id === consumerId);

    if (!consumer) return console.error("❌ Consumer not found");

    await consumer.resume();
  };

  // 비디오룸 퇴장
  const leaveVideoRoom = (roomNum: string) => {
    // 송신 트랜스포트 정리
    if (room[roomNum].video.has(socket.id)) {
      const userData = room[roomNum].video.get(socket.id);

      // 모든 Producer 정리
      userData?.producers?.forEach((producer) => producer.close());

      // Transport 정리
      userData?.transport?.close();
      room[roomNum].video.delete(socket.id);
    }

    // 수신 트랜스포트 정리
    const recvKey = `${socket.id}-recv`;
    if (room[roomNum].video.has(recvKey)) {
      const recvData = room[roomNum].video.get(recvKey);

      // 모든 Consumer 정리
      recvData?.consumers?.forEach((consumer) => consumer.close());

      // Transport 정리
      recvData?.transport?.close();
      room[roomNum].video.delete(recvKey);
    }
  };

  socket.on("clientJoinVideoRoom", joinVideoRoom);
  socket.on("clientCreateSendTransport", createSendTransport);
  socket.on("clientConnectTransport", connectTransport);
  socket.on("clientProduce", produce);
  socket.on("clientLeaveVideoRoom", leaveVideoRoom);
  socket.on("clientCreateRecvTransport", createRecvTransport);
  socket.on("clientConnectRecvTransport", connectRecvTransport);
  socket.on("clientResumeConsumer", resumeConsumer);
  socket.on("clientRequestProducers", requestProducers);
};
