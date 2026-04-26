export const quickLinks = [
  { title: "요구사항 명세서", href: "/submission-html/docs/requirements.html", kind: "문서" },
  { title: "기능 명세서", href: "/submission-html/docs/features.html", kind: "문서" },
  { title: "구조 명세서", href: "/submission-html/docs/structure.html", kind: "문서" },
  { title: "DB 명세서", href: "/submission-html/docs/database.html", kind: "문서" },
  { title: "발표 자료", href: "/submission-html/presentation/index.html", kind: "발표" },
];

export const quickThemes = [
  { label: "오션뷰", emoji: "View", to: "/lodgings?theme=ocean" },
  { label: "독채", emoji: "Stay", to: "/lodgings?theme=private" },
  { label: "이번 주말", emoji: "Weekend", to: "/lodgings?theme=weekend" },
  { label: "제주", emoji: "Jeju", to: "/lodgings?region=제주" },
  { label: "부산", emoji: "Busan", to: "/lodgings?region=부산" },
  { label: "가성비", emoji: "Deal", to: "/lodgings?theme=deal" },
];

export const promoBanners = [
  {
    id: "home-promo-jeju-breakfast",
    title: "제주 연박 고객\n조식 업그레이드",
    subtitle: "애월과 중문 중심으로 2박 이상 예약 시 혜택을 바로 적용합니다.",
    date: "03.22 - 04.14",
    accent: "sunset",
    href: "/events",
    image:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80",
  },
  {
    id: "home-promo-seoul-checkin",
    title: "서울 시티 스테이\n금토 체크인 특가",
    subtitle: "성수와 도심권에서 금요일 체크인 가능한 객실을 먼저 보여줍니다.",
    date: "03.28 - 03.30",
    accent: "peach",
    href: "/events",
    image:
      "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=1400&q=80",
  },
];

export const eventBanners = [
  {
    id: "domestic-10",
    title: "국내숙소\n10%할인권",
    subtitle: "국내 숙소 예약에 바로 적용되는 대표 쿠폰팩",
    date: "03.27 - 04.30",
    accent: "sunset",
    image:
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1400&q=80",
    action: "쿠폰 다운로드",
    href: "/lodgings?region=제주&theme=deal",
    coupon: {
      id: 901,
      userCouponId: 901,
      couponName: "국내숙소 10% 할인권",
      name: "국내숙소 10% 할인권",
      couponType: "PERCENT",
      discountValue: 10,
      discountLabel: "10%",
      status: "사용 가능",
      statusLabel: "사용 가능",
      expire: "04.30 만료",
      expiredAt: "2026-04-30",
      target: "국내 숙소",
      appliesTo: "국내 숙소",
      isUsable: true,
      issuedAt: "2026.03.27",
    },
    heroTitle: "최대 10% 할인\n국내숙소 쿠폰팩",
    heroSubtitle: "봄 여행 시즌에 맞춰 국내 숙소 예약에 바로 적용할 수 있는 대표 할인권입니다.",
    heroEyebrow: "Promotion Story",
    heroMeta: "국내 전 지역 · 예약 즉시 발급",
    detailTitle: "국내숙소 10% 할인권",
    detailCopy: "프로모션에서 쿠폰을 내려받으면 마이페이지 쿠폰함에 바로 추가됩니다.",
  },
  {
    id: "seoul-city",
    title: "TripZone첫구매\n15% 할인권",
    subtitle: "첫 예약 고객에게 바로 적용되는 웰컴 할인",
    date: "03.27 - 04.14",
    accent: "peach",
    image:
      "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=1400&q=80",
    action: "쿠폰 다운로드",
    href: "/lodgings?region=서울&theme=deal",
    coupon: {
      id: 902,
      userCouponId: 902,
      couponName: "TripZone 첫구매 15% 할인권",
      name: "TripZone 첫구매 15% 할인권",
      couponType: "PERCENT",
      discountValue: 15,
      discountLabel: "15%",
      status: "사용 가능",
      statusLabel: "사용 가능",
      expire: "04.14 만료",
      expiredAt: "2026-04-14",
      target: "첫 예약 숙소",
      appliesTo: "첫 예약 숙소",
      isUsable: true,
      issuedAt: "2026.03.27",
    },
    heroTitle: "TripZone 첫 구매\n15% 할인권",
    heroSubtitle: "첫 예약 고객이 바로 체감할 수 있는 웰컴 프로모션으로, 도심 숙소와 주말 일정에 맞춰 기획했습니다.",
    heroEyebrow: "Welcome Benefit",
    heroMeta: "서울 도심권 · 신규 회원 우선",
    detailTitle: "TripZone 첫구매 15% 할인권",
    detailCopy: "다운로드 후 마이페이지 쿠폰함에서 즉시 보유 수량이 늘어납니다.",
  },
  {
    id: "kh-staff",
    title: "kh직원\n3%추가할인쿠폰",
    subtitle: "사내 전용 추가 할인 쿠폰으로 일반 할인과 함께 사용",
    date: "03.27 - 04.18",
    accent: "mint",
    image:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1400&q=80",
    action: "쿠폰 다운로드",
    href: "/lodgings?theme=deal",
    coupon: {
      id: 904,
      userCouponId: 904,
      couponName: "kh직원 3% 추가할인쿠폰",
      name: "kh직원 3% 추가할인쿠폰",
      couponType: "PERCENT",
      discountValue: 3,
      discountLabel: "3%",
      status: "사용 가능",
      statusLabel: "사용 가능",
      expire: "04.18 만료",
      expiredAt: "2026-04-18",
      target: "임직원 전용 숙소",
      appliesTo: "임직원 전용 숙소",
      isUsable: true,
      issuedAt: "2026.03.27",
    },
    heroTitle: "임직원 전용\n3% 추가 할인",
    heroSubtitle: "사내 임직원 대상 혜택을 별도 쿠폰으로 분리해, 메인 프로모션과 함께 내려받을 수 있게 구성했습니다.",
    heroEyebrow: "Staff Benefit",
    heroMeta: "사내 계정 확인 후 사용",
    detailTitle: "kh직원 3% 추가할인쿠폰",
    detailCopy: "다운로드 후 임직원 전용 혜택으로 마이페이지 쿠폰함에 바로 반영됩니다.",
  },
  {
    id: "busan-ocean",
    title: "봄맞이\n숙소할인쿠폰",
    subtitle: "봄 시즌 숙소에 맞춘 시즌성 할인 쿠폰",
    date: "03.27 - 04.21",
    accent: "dusk",
    image:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80",
    action: "쿠폰 다운로드",
    href: "/lodgings?region=부산&theme=ocean",
    coupon: {
      id: 903,
      userCouponId: 903,
      couponName: "봄맞이 숙소 할인쿠폰",
      name: "봄맞이 숙소 할인쿠폰",
      couponType: "AMOUNT",
      discountValue: 8000,
      discountLabel: "8,000원",
      status: "사용 가능",
      statusLabel: "사용 가능",
      expire: "04.21 만료",
      expiredAt: "2026-04-21",
      target: "부산 오션뷰 숙소",
      appliesTo: "부산 오션뷰 숙소",
      isUsable: true,
      issuedAt: "2026.03.27",
    },
    heroTitle: "봄맞이\n숙소 할인쿠폰",
    heroSubtitle: "오션뷰와 주말 여행 흐름에 맞춘 시즌성 쿠폰으로, 부산 지역 특가 숙소 탐색과 같이 보도록 구성했습니다.",
    heroEyebrow: "Spring Deal",
    heroMeta: "부산 해운대 · 광안리 적용",
    detailTitle: "봄맞이 숙소 할인쿠폰",
    detailCopy: "다운로드 후 부산 오션뷰 숙소 예약에 바로 사용할 수 있습니다.",
  },
];

export const participationEventBanners = [
  {
    id: "spring-review",
    title: "봄리뷰이벤트\n(리뷰작성 이벤트)",
    subtitle: "리뷰 작성 후 추첨으로 추가 쿠폰을 지급하는 참여형 이벤트",
    action: "이벤트 보기",
    heroTitle: "봄 리뷰 이벤트",
    heroSubtitle: "숙박 완료 후 리뷰를 작성하면 추첨을 통해 시즌 쿠폰을 추가 지급하는 참여형 이벤트입니다.",
    heroEyebrow: "Review Event",
    heroMeta: "리뷰 작성 완료 회원 대상",
    detailTitle: "봄 리뷰 이벤트",
    detailCopy: "참여형 이벤트는 즉시 다운로드보다 참여 조건과 지급 기준을 먼저 안내합니다.",
  },
  {
    id: "today-special",
    title: "오늘의\n특가숙소",
    subtitle: "당일 예약 기준으로 가격 메리트가 큰 숙소를 빠르게 모아보기",
    action: "특가 보기",
    heroTitle: "오늘의 특가 숙소",
    heroSubtitle: "당일 체크인 가능한 객실 중 가격 메리트가 큰 상품을 우선 노출하는 데일리 기획전입니다.",
    heroEyebrow: "Today Deal",
    heroMeta: "당일 예약 · 즉시 확인",
    detailTitle: "오늘의 특가 숙소",
    detailCopy: "오늘의 특가 숙소는 빠른 탐색 중심 이벤트이므로 특가 리스트 이동과 요약 안내를 같이 제공합니다.",
  },
  {
    id: "weekend-time",
    title: "주말여행\n타임딜!",
    subtitle: "주말 체크인 수요에 맞춘 한정 시간 오픈 이벤트",
    action: "타임딜 보기",
    heroTitle: "주말여행 타임딜",
    heroSubtitle: "주말 여행 수요가 몰리는 구간에 맞춰 시간 한정 특가를 여는 타입의 프로모션입니다.",
    heroEyebrow: "Time Deal",
    heroMeta: "금-토 체크인 한정",
    detailTitle: "주말여행 타임딜",
    detailCopy: "타임딜은 오픈 시간과 적용 숙소를 중심으로 노출하도록 설계합니다.",
  },
  {
    id: "invite-challenge",
    title: "친구초대\n챌린지",
    subtitle: "초대와 첫 예약 완료 기준으로 리워드를 지급하는 참여형 이벤트",
    action: "챌린지 보기",
    heroTitle: "친구초대 챌린지",
    heroSubtitle: "친구 초대 후 첫 예약이 완료되면 쿠폰이나 포인트를 적립해 주는 챌린지형 이벤트입니다.",
    heroEyebrow: "Invite Challenge",
    heroMeta: "초대 링크 참여 기반",
    detailTitle: "친구초대 챌린지",
    detailCopy: "이벤트 참여 조건, 보상 기준, 초대 성공 수를 명확하게 보여주는 것이 핵심입니다.",
  },
];

export const docsPrinciples = [
  {
    title: "문서형 산출물",
    copy: "요구사항, 기능, 구조, DB 문서는 정보 위계와 제출 가독성을 우선한다.",
  },
  {
    title: "발표형 산출물",
    copy: "발표 deck은 왜 이런 구조를 택했는지 빠르게 이해시키는 서사에 집중한다.",
  },
  {
    title: "구현형 산출물",
    copy: "프론트는 목업으로 흐름을 검증하고 나중에 API를 연결하는 방식으로 진행한다.",
  },
];

export const roleData = [
  {
    name: "User",
    subtitle: "탐색과 예약 중심",
    copy: "회원가입, 로그인, 숙소 탐색, 예약, 결제, 리뷰, 문의",
  },
  {
    name: "Seller",
    subtitle: "운영과 응답 중심",
    copy: "판매자 승인 신청, 숙소/객실 등록, 예약 처리, 문의 응답",
  },
  {
    name: "Admin",
    subtitle: "통제와 정책 중심",
    copy: "판매자 승인, 회원 상태 관리, 이벤트/쿠폰, 문의 모니터링",
  },
];

function toISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDefaultStayDates() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const checkIn = new Date(today);
  checkIn.setDate(today.getDate() + 1);

  const checkOut = new Date(checkIn);
  checkOut.setDate(checkIn.getDate() + 1);

  return {
    checkIn: toISODate(checkIn),
    checkOut: toISODate(checkOut),
  };
}

const defaultStayDates = getDefaultStayDates();

export const homeSearchDefaults = {
  keyword: "",
  checkIn: defaultStayDates.checkIn,
  checkOut: defaultStayDates.checkOut,
  guests: "2",
};

export const destinationStats = [
  { label: "오늘 확인 가능한 숙소", value: "128+" },
  { label: "이번 주말 특가", value: "24" },
  { label: "즉시 확정 객실", value: "56" },
];
