import { useEffect, useMemo, useRef, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import {
  getSellerInquiryMessages,
  getSellerInquiryRooms,
  sendSellerInquiryReply,
  subscribeSellerInquiryRoom,
} from "../../services/sellerInquiryService";
import { updateSellerInquiryRoomPreview } from "../../utils/sellerInquiryCenter";

const statusLabel = {
  OPEN: "접수",
  WAITING: "접수",
  ANSWERED: "답변 완료",
  CLOSED: "종료",
  BLOCKED: "차단",
};

const typeLabel = {
  LODGING: "숙소 문의",
  BOOKING: "예약 문의",
  PAYMENT: "결제 문의",
  SYSTEM: "시스템 문의",
};

export default function SellerInquiriesPage() {
  const [inquiryRooms, setInquiryRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const unsubscribeRef = useRef(() => {});

  const selectedRoom = useMemo(
    () => inquiryRooms.find((room) => room.id === selectedRoomId) ?? inquiryRooms[0] ?? null,
    [inquiryRooms, selectedRoomId],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadRooms() {
      setIsLoading(true);

      try {
        const rows = await getSellerInquiryRooms();
        if (cancelled) return;
        setInquiryRooms(rows);
        setSelectedRoomId((current) => current ?? rows[0]?.id ?? null);
      } catch (error) {
        console.error("Failed to load seller inquiry rooms.", error);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadRooms();

    return () => {
      cancelled = true;
      unsubscribeRef.current();
      unsubscribeRef.current = () => {};
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadMessages() {
      unsubscribeRef.current();
      unsubscribeRef.current = () => {};

      if (!selectedRoom?.id) {
        setMessages([]);
        return;
      }

      try {
        const nextMessages = await getSellerInquiryMessages(selectedRoom.id);
        if (cancelled) return;
        setMessages(nextMessages);
        unsubscribeRef.current = await subscribeSellerInquiryRoom(selectedRoom.id, (message) => {
          setMessages((current) => (current.some((row) => row.id === message.id) ? current : [...current, message]));
          setInquiryRooms((current) => updateSellerInquiryRoomPreview(current, selectedRoom.id, message));
        });
      } catch (error) {
        console.error("Failed to load seller inquiry messages.", error);
      }
    }

    loadMessages();

    return () => {
      cancelled = true;
      unsubscribeRef.current();
      unsubscribeRef.current = () => {};
    };
  }, [selectedRoom?.id]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body || !selectedRoom?.id) return;

    try {
      await sendSellerInquiryReply(selectedRoom.id, body);
      setDraft("");
    } catch (error) {
      console.error("Failed to send seller inquiry reply.", error);
    }
  };

  return (
    <DashboardLayout role="seller">
      <div className="dash-page-header">
        <div className="dash-page-header-copy">
          <p className="eyebrow">문의 운영</p>
          <h1>문의 관리</h1>
        </div>
        <div className="dash-chips">
          <span className="dash-chip is-warning">접수 {inquiryRooms.filter((r) => r.status === "OPEN" || r.status === "WAITING").length}건</span>
          <span className="dash-chip is-accent">답변 완료 {inquiryRooms.filter((r) => r.status === "ANSWERED").length}건</span>
          <span className="dash-chip">종료 {inquiryRooms.filter((r) => r.status === "CLOSED").length}건</span>
        </div>
      </div>

      <section className="inquiry-layout">
        <aside className="inquiry-room-list">
          {isLoading ? (
            <div className="my-empty-panel">
              <strong>문의 목록을 불러오는 중입니다.</strong>
            </div>
          ) : null}

          {!isLoading && !inquiryRooms.length ? (
            <div className="my-empty-panel">
              <strong>아직 접수된 문의가 없습니다.</strong>
              <p>회원이 숙소문의에서 대화를 시작하면 여기에 표시됩니다.</p>
            </div>
          ) : null}

          {inquiryRooms.map((room) => (
            <button
              key={room.id}
              type="button"
              className={`inquiry-room-card${selectedRoom?.id === room.id ? " is-active" : ""}`}
              onClick={() => setSelectedRoomId(room.id)}
            >
              <div className="inquiry-room-top">
                <strong>{room.title}</strong>
                <span className={`table-code code-${String(room.status).toLowerCase()}`}>
                  {statusLabel[room.status] ?? room.status}
                </span>
              </div>
              <div className="inquiry-room-meta">
                <span>{typeLabel[room.type] ?? room.type}</span>
                <span>{room.updatedAt}</span>
              </div>
              <p>{room.preview}</p>
              <div className="inquiry-room-foot">
                <span>{room.lodging}</span>
                <span>{room.bookingNo}</span>
              </div>
            </button>
          ))}
        </aside>

        <section className="inquiry-thread-panel">
          <div className="inquiry-thread-head">
            <div>
              <p className="eyebrow">{typeLabel[selectedRoom?.type] ?? "문의"}</p>
              <h2>{selectedRoom?.title ?? "숙소 문의"}</h2>
            </div>
            <div className="inquiry-thread-meta">
              <span>{selectedRoom?.lodging ?? "숙소 정보 없음"}</span>
              <span>{selectedRoom?.bookingNo ?? "예약 미연결"}</span>
            </div>
          </div>

          <div className="inquiry-thread-list">
            {!messages.length ? (
              <div className="my-empty-panel">
                <strong>아직 문의 메시지가 없습니다.</strong>
                <p>회원이 첫 문의를 남기면 이 영역에서 바로 확인할 수 있습니다.</p>
              </div>
            ) : null}

            {messages.map((message) => (
              <article
                key={`${selectedRoom?.id}-${message.id}`}
                className={`inquiry-message${message.senderType === "USER" ? " is-user" : " is-operator"}`}
              >
                <div className="inquiry-message-head">
                  <strong>{message.sender}</strong>
                  <span>{message.time}</span>
                </div>
                <p>{message.body}</p>
              </article>
            ))}
          </div>
          <form className="lodging-inquiry-form" onSubmit={handleSubmit}>
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="회원 문의에 바로 답변을 남기세요."
              rows={3}
            />
            <div className="lodging-inquiry-form-foot">
              <span>판매자 답변은 회원 숙소문의 창과 같은 흐름으로 이어집니다.</span>
              <button type="submit" className="primary-button">
                답변 보내기
              </button>
            </div>
          </form>
        </section>
      </section>
    </DashboardLayout>
  );
}
