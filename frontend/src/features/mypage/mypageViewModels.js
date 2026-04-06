export const BOOKING_STATUS_LABELS = {
  CONFIRMED: "확정",
  PENDING: "대기",
  COMPLETED: "숙박 완료",
  CANCELED: "예약 취소",
};

export const INQUIRY_STATUS_LABELS = {
  OPEN: "접수",
  ANSWERED: "답변 완료",
  CLOSED: "종료",
  BLOCKED: "차단",
  PENDING: "접수",
  COMPLETED: "답변 완료",
  DELETE: "삭제",
};

export const INQUIRY_TYPE_LABELS = {
  BOOKING: "예약 문의",
  PAYMENT: "결제 문의",
  SYSTEM: "서비스 문의",
  MANAGEMENT: "운영 문의",
  ETC: "기타 문의",
};

export const INQUIRY_TYPE_OPTIONS = [
  { value: "BOOKING", label: "예약 문의", hint: "취소 규정, 일정 변경, 예약 오류" },
  { value: "PAYMENT", label: "결제 문의", hint: "결제 오류, 환불, 영수증" },
  { value: "SYSTEM", label: "서비스 문의", hint: "로그인, 인증, 계정 문제" },
];

export const DEFAULT_INQUIRY_FORM = {
  title: "",
  type: "BOOKING",
  lodging: "",
  bookingNo: "",
  body: "",
};

export function makeBookingId(item) {
  return `${item.lodgingId}-${item.stay.replace(/\./g, "").replace(/\s/g, "")}`;
}

export function getProfileFieldGroups(details) {
  return {
    accountInfoRows: details.filter((item) => ["이메일", "전화번호", "회원 등급"].includes(item.label)),
    accountMetaRows: details.filter((item) => ["비밀번호", "마케팅 수신", "최근 로그인"].includes(item.label)),
  };
}

const INACTIVE_STATUSES = ["COMPLETED", "CANCELED"];

export function getBookingTabSummary(rows) {
  const upcomingCount = rows.filter((item) => !INACTIVE_STATUSES.includes(item.status)).length;
  const completedCount = rows.filter((item) => item.status === "COMPLETED").length;
  return { upcomingCount, completedCount };
}

export function filterBookingRows(rows, tab) {
  return rows.filter((item) => {
    if (tab === "upcoming") return !INACTIVE_STATUSES.includes(item.status);
    if (tab === "completed") return INACTIVE_STATUSES.includes(item.status);
    return true;
  });
}

export function getCouponSummary(rows, filter) {
  const availableCount = rows.filter((item) => item.isUsable).length;
  const expiringCount = rows.filter((item) => !item.isUsable && item.status !== "USED").length;
  const usedCount = rows.filter((item) => item.status === "USED").length;
  const filteredCoupons = rows.filter((item) => {
    if (filter === "available") return item.isUsable;
    if (filter === "used") return item.status === "USED";
    if (filter === "expiring") return !item.isUsable && item.status !== "USED";
    return false;
  });

  return { availableCount, expiringCount, usedCount, filteredCoupons };
}

export function getCouponAmount(item) {
  return item.name.match(/(\d[\d,]*(?:%|원))/)?.[1] ?? "혜택 확인";
}

export function getCouponToneClass(item) {
  if (item.isUsable) return "is-available";
  if (item.status === "USED") return "is-used";
  return "is-expiring";
}

export function getCouponVisualClass(item) {
  if (item.target.includes("제주")) return "is-jeju";
  if (item.target.includes("도심")) return "is-city";
  if (item.target.includes("첫")) return "is-pass";
  return "is-stay";
}

export function getMileageSummary(rows, filter) {
  const now = new Date();
  const currentMonthPrefix = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}`;

  const parseSignedAmount = (value) => {
    const normalized = String(value ?? "").replace(/[^0-9+-]/g, "");
    const numeric = Number(normalized);
    return Number.isFinite(numeric) ? numeric : 0;
  };

  const isCurrentMonth = (item) => String(item.time ?? "").startsWith(currentMonthPrefix);

  const earnedThisMonth = rows
    .filter((item) => item.type === "적립" && isCurrentMonth(item))
    .reduce((sum, item) => sum + Math.abs(parseSignedAmount(item.amount)), 0);
  const usedThisMonth = rows
    .filter((item) => item.type === "사용" || item.type === "사용 복구")
    .filter(isCurrentMonth)
    .reduce((sum, item) => {
      const amount = Math.abs(parseSignedAmount(item.amount));
      return item.type === "사용 복구" ? sum - amount : sum + amount;
    }, 0);
  const filteredRows = rows.filter((item) => {
    if (filter === "all") return true;
    if (filter === "earn") return item.type === "적립";
    if (filter === "use") return item.type === "사용" || item.type === "사용 복구";
    return false;
  });

  return { earnedThisMonth, usedThisMonth, filteredRows };
}

export function getPaymentSummary(rows) {
  const isRefundLike = (status) => ["REFUNDED", "CANCELED"].includes(status);

  return {
    paidCount: rows.filter((item) => item.status === "PAID").length,
    refundedCount: rows.filter((item) => isRefundLike(item.status)).length,
    recentPaidAmount: rows.find((item) => item.status === "PAID")?.amount ?? "-",
    recentRefundedAmount: rows.find((item) => isRefundLike(item.status))?.amount ?? "-",
  };
}

export function getInquiryCounts(rows) {
  return {
    answeredCount: rows.filter((item) => item.status === "ANSWERED" || item.status === "COMPLETED").length,
  };
}

export function normalizeMembershipGrade(grade = "") {
  const normalized = String(grade ?? "").trim().toUpperCase();

  if (!normalized || normalized === "회원" || normalized === "MEMBER") {
    return "회원";
  }

  if (["BASIC", "SILVER", "GOLD", "BLACK"].includes(normalized)) {
    return normalized;
  }

  return String(grade ?? "").trim() || "회원";
}

export function formatMembershipLabel(grade = "") {
  const normalized = normalizeMembershipGrade(grade);
  return normalized === "회원" ? "회원" : `${normalized} 회원`;
}

export function formatMembershipGradeLabel(grade = "") {
  const normalized = normalizeMembershipGrade(grade);
  return normalized === "회원" ? "회원 등급" : `${normalized} 등급`;
}

export function buildInquiryCreateForm(initialType) {
  return {
    ...DEFAULT_INQUIRY_FORM,
    type: INQUIRY_TYPE_OPTIONS.some((option) => option.value === initialType)
      ? initialType
      : DEFAULT_INQUIRY_FORM.type,
  };
}

export function buildInquiryEditForm(thread) {
  return {
    title: thread.title,
    type: thread.type,
    lodging: thread.lodging,
    bookingNo: thread.bookingNo,
    body: thread.body,
  };
}
