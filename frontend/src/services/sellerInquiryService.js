import { readAuthSession } from "../features/auth/authSession";
import { get, getApiBaseUrl, post } from "../lib/appClient";
import { mapSellerInquiryMessage, mapSellerInquiryRoom } from "../utils/sellerInquiryCenter";

let inquiryClient = null;
let inquiryConnectPromise = null;
let StompClient = null;
let SockJSClient = null;

function getAccessToken() {
  const accessToken = readAuthSession()?.accessToken;
  if (!accessToken) {
    throw new Error("로그인이 필요합니다.");
  }

  return accessToken;
}

async function ensureInquirySocketClient() {
  if (inquiryClient?.connected) {
    return inquiryClient;
  }

  if (inquiryConnectPromise) {
    return inquiryConnectPromise;
  }

  if (!StompClient || !SockJSClient) {
    const [{ Client }, sockJsModule] = await Promise.all([import("@stomp/stompjs"), import("sockjs-client")]);
    StompClient = Client;
    SockJSClient = sockJsModule.default;
  }

  inquiryClient = new StompClient({
    webSocketFactory: () => new SockJSClient(`${getApiBaseUrl()}/ws`),
    connectHeaders: {
      Authorization: `Bearer ${getAccessToken()}`,
    },
    reconnectDelay: 5000,
    debug: () => {},
  });

  inquiryConnectPromise = new Promise((resolve, reject) => {
    inquiryClient.onConnect = () => {
      const client = inquiryClient;
      inquiryConnectPromise = null;
      resolve(client);
    };
    inquiryClient.onWebSocketError = () => {
      inquiryConnectPromise = null;
      reject(new Error("문의 실시간 연결에 실패했습니다."));
    };
    inquiryClient.onStompError = (frame) => {
      inquiryConnectPromise = null;
      reject(new Error(frame.headers.message || "문의 실시간 연결에 실패했습니다."));
    };
  });

  inquiryClient.activate();
  return inquiryConnectPromise;
}

async function enrichInquiryRooms(rows) {
  const rooms = await Promise.all(
    rows.map(async (dto) => {
      const messages = await getSellerInquiryMessages(dto.inquiryRoomNo);
      return mapSellerInquiryRoom(dto, messages.at(-1));
    }),
  );

  return rooms.sort((a, b) => Number(new Date(b.updDate ?? 0)) - Number(new Date(a.updDate ?? 0)));
}

export async function getSellerInquiryRooms() {
  const rows = await get("/api/inquiry/room/seller");
  return enrichInquiryRooms(rows);
}

export async function getMyInquiryRooms() {
  const rows = await get("/api/inquiry/room/me");
  return enrichInquiryRooms(rows);
}

export async function findMyInquiryRoomByLodgingId(lodgingId) {
  const rooms = await getMyInquiryRooms();
  return rooms.find((room) => Number(room.lodgingId) === Number(lodgingId)) ?? null;
}

export async function getSellerInquiryMessages(roomId) {
  if (!roomId) return [];
  const rows = await get(`/api/inquiry/room/${roomId}/messages`);
  return rows.map(mapSellerInquiryMessage);
}

export async function createSellerInquiryRoom(payload) {
  const result = await post("/api/inquiry/room/", {
    lodgingNo: payload.lodgingId,
  });

  return result.result;
}

export async function subscribeSellerInquiryRoom(roomId, onMessage) {
  const client = await ensureInquirySocketClient();
  const subscription = client.subscribe(`/topic/inquiry/${roomId}`, (frame) => {
    const payload = JSON.parse(frame.body);
    onMessage(mapSellerInquiryMessage(payload));
  });

  return () => subscription.unsubscribe();
}

export async function sendSellerInquiryMessage(roomId, body) {
  const client = await ensureInquirySocketClient();
  client.publish({
    destination: `/app/inquiry/${roomId}/send`,
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
    },
    body: JSON.stringify({
      content: body,
    }),
  });
}

export async function sendGuestInquiryMessage(payload) {
  const roomId = payload.roomId ?? (await createSellerInquiryRoom({ lodgingId: payload.lodgingId }));
  await sendSellerInquiryMessage(roomId, payload.body);
  return roomId;
}

export async function sendSellerInquiryReply(roomId, body) {
  await sendSellerInquiryMessage(roomId, body);
}
