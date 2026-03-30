function formatDateTime(dateValue) {
  if (!dateValue) return "방금 전";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "방금 전";

  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60_000) return "방금 전";
  if (diff < 3_600_000) return `${Math.max(1, Math.floor(diff / 60_000))}분 전`;

  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) {
    return `오늘 ${date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false })}`;
  }

  return `${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")} ${date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false })}`;
}

export function mapSellerInquiryMessage(dto) {
  return {
    id: dto.messageNo,
    sender: dto.senderType === "USER" ? "회원" : "판매자",
    senderType: dto.senderType,
    senderName: dto.senderName,
    time: formatDateTime(dto.regDate),
    body: dto.content,
    regDate: dto.regDate,
  };
}

export function mapSellerInquiryRoom(dto, latestMessage) {
  return {
    id: dto.inquiryRoomNo,
    lodgingId: dto.lodgingNo,
    title: `${dto.lodgingName} 숙소 문의`,
    type: "LODGING",
    status: dto.status,
    lodging: dto.lodgingName,
    hostName: dto.hostName,
    bookingNo: "예약 미연결",
    updatedAt: formatDateTime(dto.updDate ?? latestMessage?.regDate),
    preview: latestMessage?.body ?? dto.lastMessage ?? "대화를 시작해보세요.",
    regDate: dto.regDate,
    updDate: dto.updDate,
  };
}

export function updateSellerInquiryRoomPreview(rooms, roomId, message) {
  return [...rooms]
    .map((room) =>
      Number(room.id) === Number(roomId)
        ? {
            ...room,
            updatedAt: message.time,
            preview: message.body,
            status: message.senderType === "USER" ? "WAITING" : "ANSWERED",
          }
        : room,
    )
    .sort((a, b) => Number(new Date(b.updDate ?? 0)) - Number(new Date(a.updDate ?? 0)));
}
