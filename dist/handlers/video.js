"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.videoHandler = void 0;
const mediasoup = __importStar(require("mediasoup"));
const __1 = require("..");
let worker;
let router;
const createWorkerAndRouter = () => __awaiter(void 0, void 0, void 0, function* () {
    if (!worker) {
        worker = yield mediasoup.createWorker({
            rtcMinPort: 40000,
            rtcMaxPort: 49999,
        });
    }
    if (!router) {
        router = yield worker.createRouter({
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
});
// 서버 시작 시 worker & router 생성
(() => __awaiter(void 0, void 0, void 0, function* () {
    yield createWorkerAndRouter();
}))();
const videoHandler = (socket, io) => {
    // 비디오룸 참여 - 클라이언트에게 어떤 오디오 / 비디오 코덱을 지원하는지에 대한 정보를 전송
    const joinVideoRoom = (roomNum) => __awaiter(void 0, void 0, void 0, function* () {
        socket.join(`${roomNum}-video`);
        io.to(`${roomNum}-video`).emit("serverRtpCapabilities", router.rtpCapabilities);
    });
    // 송신 Transport 생성
    const createSendTransport = (roomNum) => __awaiter(void 0, void 0, void 0, function* () {
        const transport = yield router.createWebRtcTransport({
            listenIps: [{ ip: "127.0.0.1", announcedIp: null }], // 공인 IP 추가
            enableUdp: true,
            enableTcp: true,
            preferUdp: true,
        });
        // Transport 저장
        __1.room[roomNum].video.set(socket.id, {
            transport,
            producers: [],
        });
        // Transport 연결 이벤트
        transport.on("dtlsstatechange", (state) => {
            if (state === "closed") {
                __1.room[roomNum].video.delete(socket.id);
            }
        });
        socket.emit("serverSendTransportCreated", {
            id: transport.id,
            iceParameters: transport.iceParameters,
            iceCandidates: transport.iceCandidates,
            dtlsParameters: transport.dtlsParameters,
        });
    });
    // 송신 Transport 연결
    const connectTransport = (_a) => __awaiter(void 0, [_a], void 0, function* ({ roomNum, dtlsParameters }) {
        const userData = __1.room[roomNum].video.get(socket.id);
        if (!(userData === null || userData === void 0 ? void 0 : userData.transport))
            return console.error("❌ Transport not found");
        yield userData.transport.connect({ dtlsParameters });
        console.log(`✅ Transport connected: ${socket.id}`);
    });
    // 새로운 프로듀서 발생 시 처리
    const handleNewProducer = (_b) => __awaiter(void 0, [_b], void 0, function* ({ roomNum, producerId, rtpCapabilities, ownerId, }) {
        var _c;
        // 방의 모든 수신자(RecvTransport 보유자)에게 Consumer 생성
        for (const [socketId, userData] of __1.room[roomNum].video) {
            if (!socketId.endsWith("-recv"))
                continue;
            try {
                const producer = (_c = __1.room[roomNum].video
                    .get(ownerId)) === null || _c === void 0 ? void 0 : _c.producers.find((p) => p.id === producerId);
                if (!producer)
                    continue;
                const consumer = yield userData.transport.consume({
                    producerId,
                    rtpCapabilities,
                    paused: true,
                });
                userData.consumers || (userData.consumers = []);
                userData.consumers.push(consumer);
                __1.room[roomNum].video.set(socketId, userData);
                // 해당 소켓에만 Consumer 정보 전송
                io.to(socketId.replace("-recv", "")).emit("serverNewProducer", {
                    producerId,
                    consumerId: consumer.id,
                    kind: consumer.kind,
                    rtpParameters: consumer.rtpParameters,
                });
            }
            catch (error) {
                console.error(`❌ [${socketId}] Consumer 생성 실패:`, error);
            }
        }
    });
    // 송신 프로듀서 생성
    const produce = (_d) => __awaiter(void 0, [_d], void 0, function* ({ roomNum, kind, rtpParameters, rtpCapabilities, }) {
        const userData = __1.room[roomNum].video.get(socket.id);
        if (!userData || !userData.transport)
            return;
        const producer = yield userData.transport.produce({ kind, rtpParameters });
        userData.producers.push(producer);
        __1.room[roomNum].video.set(socket.id, userData);
        socket.emit("serverProduced", { id: producer.id });
        handleNewProducer({
            roomNum,
            producerId: producer.id,
            rtpCapabilities,
            ownerId: socket.id,
        });
    });
    // 수신 트랜스포트 생성
    const createRecvTransport = (roomNum) => __awaiter(void 0, void 0, void 0, function* () {
        const transport = yield router.createWebRtcTransport({
            listenIps: [{ ip: "127.0.0.1", announcedIp: null }],
            enableUdp: true,
            enableTcp: true,
            preferUdp: true,
        });
        __1.room[roomNum].video.set(`${socket.id}-recv`, { transport, consumers: [] });
        transport.on("dtlsstatechange", (state) => {
            if (state === "closed") {
                __1.room[roomNum].video.delete(`${socket.id}-recv`);
            }
        });
        socket.emit("serverRecvTransportCreated", {
            id: transport.id,
            iceParameters: transport.iceParameters,
            iceCandidates: transport.iceCandidates,
            dtlsParameters: transport.dtlsParameters,
        });
    });
    // 수신 트랜스포트 연결
    const connectRecvTransport = (_e) => __awaiter(void 0, [_e], void 0, function* ({ roomNum, dtlsParameters }) {
        const userData = __1.room[roomNum].video.get(`${socket.id}-recv`);
        if (!(userData === null || userData === void 0 ? void 0 : userData.transport))
            return;
        if (userData.transport.dtlsState !== "new")
            return;
        try {
            yield userData.transport.connect({ dtlsParameters });
        }
        catch (error) {
            console.error(`❌ [${socket.id}] RecvTransport 연결 실패:`, error);
        }
    });
    // 기존 프로듀서 목록 전달
    const requestProducers = (_f) => __awaiter(void 0, [_f], void 0, function* ({ roomNum, rtpCapabilities, }) {
        const recvData = __1.room[roomNum].video.get(`${socket.id}-recv`);
        if (!(recvData === null || recvData === void 0 ? void 0 : recvData.transport)) {
            console.error("RecvTransport not found");
            return;
        }
        // 기존 Producer 수집
        const producers = Array.from(__1.room[roomNum].video.entries())
            .filter(([id]) => !id.endsWith("-recv") && id !== socket.id)
            .flatMap(([, data]) => data.producers || []);
        // Consumer 생성
        const consumersInfo = yield Promise.all(producers.map((producer) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const consumer = yield recvData.transport.consume({
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
            }
            catch (error) {
                console.error(`Consumer 생성 실패 (${producer.id}):`, error);
                return null;
            }
        })));
        // 성공한 Consumer만 필터링
        socket.emit("serverExistingProducers", consumersInfo.filter((info) => info !== null));
    });
    // 컨슈머 재개
    const resumeConsumer = (_g) => __awaiter(void 0, [_g], void 0, function* ({ roomNum, consumerId, }) {
        const userData = __1.room[roomNum].video.get(`${socket.id}-recv`);
        if (!userData)
            return console.error("❌ RecvTransport not found");
        const consumer = userData.consumers.find((c) => c.id === consumerId);
        if (!consumer)
            return console.error("❌ Consumer not found");
        yield consumer.resume();
    });
    // 비디오룸 퇴장
    const leaveVideoRoom = (roomNum) => {
        var _a, _b, _c, _d;
        // 송신 트랜스포트 정리
        if (__1.room[roomNum].video.has(socket.id)) {
            const userData = __1.room[roomNum].video.get(socket.id);
            // 모든 Producer 정리
            (_a = userData === null || userData === void 0 ? void 0 : userData.producers) === null || _a === void 0 ? void 0 : _a.forEach((producer) => producer.close());
            // Transport 정리
            (_b = userData === null || userData === void 0 ? void 0 : userData.transport) === null || _b === void 0 ? void 0 : _b.close();
            __1.room[roomNum].video.delete(socket.id);
        }
        // 수신 트랜스포트 정리
        const recvKey = `${socket.id}-recv`;
        if (__1.room[roomNum].video.has(recvKey)) {
            const recvData = __1.room[roomNum].video.get(recvKey);
            // 모든 Consumer 정리
            (_c = recvData === null || recvData === void 0 ? void 0 : recvData.consumers) === null || _c === void 0 ? void 0 : _c.forEach((consumer) => consumer.close());
            // Transport 정리
            (_d = recvData === null || recvData === void 0 ? void 0 : recvData.transport) === null || _d === void 0 ? void 0 : _d.close();
            __1.room[roomNum].video.delete(recvKey);
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
exports.videoHandler = videoHandler;
