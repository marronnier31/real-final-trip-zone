function formatMetricValue(value) {
  return String(value ?? 0).padStart(2, "0");
}

export function getAdminDashboardViewModel({ users, sellers, adminInquiries, adminTasks }) {
  const blockedUsers = users.filter((item) => item.status === "BLOCKED");
  const dormantUsers = users.filter((item) => item.status === "DORMANT");
  const attentionUsers = [...blockedUsers, ...dormantUsers].slice(0, 2);
  const pendingSellers = sellers.filter((item) => item.status === "PENDING").length;
  const openInquiries = adminInquiries.filter((item) => item.status === "OPEN").length;

  return {
    header: {
      eyebrow: "관리자센터",
      title: "운영 워크스페이스",
      description: "실제 회원, 판매자, 문의 데이터를 기준으로 운영 상태를 확인합니다.",
      spotlight: {
        label: "우선 확인",
        value: `${formatMetricValue(openInquiries)}건`,
        note: "미답변 문의와 승인 대기 판매자를 먼저 처리합니다.",
      },
      facts: [
        { label: "전체 회원", value: `${formatMetricValue(users.length)}명` },
        { label: "전체 판매자", value: `${formatMetricValue(sellers.length)}명` },
        { label: "승인 대기", value: `${formatMetricValue(pendingSellers)}건` },
        { label: "미답변 문의", value: `${formatMetricValue(openInquiries)}건` },
      ],
      links: [
        { label: "판매자 승인", to: "/admin/sellers" },
        { label: "회원 관리", to: "/admin/users" },
        { label: "문의 모니터링", to: "/admin/inquiries" },
        { label: "이벤트 · 쿠폰", to: "/admin/events" },
        { label: "리뷰 운영", to: "/admin/reviews" },
      ],
    },
    metrics: [
      {
        label: "전체 회원", value: formatMetricValue(users.length),
        trend: "실데이터", trendUp: true,
      },
      {
        label: "전체 판매자", value: formatMetricValue(sellers.length),
        trend: "실데이터", trendUp: true,
      },
      {
        label: "승인 대기 판매자", value: formatMetricValue(pendingSellers),
        alert: pendingSellers > 0,
        trend: "처리 필요", trendUp: false,
      },
      {
        label: "미답변 문의", value: formatMetricValue(openInquiries),
        alert: openInquiries > 0,
        trend: "처리 필요", trendUp: false,
      },
    ],
    reservationMix: [],
    sellerPerformance: [],
    watchRows: [
      ...sellers.map((item) => ({
        kind: "판매자",
        title: item.business,
        status: item.status,
        meta: `${item.owner} · ${item.region}`,
        to: "/admin/sellers",
      })),
      ...adminInquiries.map((item) => ({
        kind: "문의",
        title: item.title,
        status: item.status,
        meta: `${item.owner} · ${item.type}`,
        to: "/admin/inquiries",
      })),
    ].slice(0, 6),
    trends: [],
    monthlyPerformance: [],
    lodgingMix: [],
    attentionUsers: attentionUsers.map((item) => ({
      status: item.status,
      role: item.role,
      name: item.name,
      email: item.email,
    })),
    facts: [
      { label: "차단 회원", value: formatMetricValue(blockedUsers.length) },
      { label: "휴면 회원", value: formatMetricValue(dormantUsers.length) },
    ],
    checklist: adminTasks ?? [],
  };
}

export function getSellerDashboardViewModel({ reservations, lodgings, metrics, sellerTasks }) {
  const todayReservations = reservations.slice(0, 4);
  const activeLodgings = lodgings.filter((item) => item.status === "ACTIVE").length;
  const waitingInquiries = metrics.find((item) => item.label === "답변 대기 문의")?.value ?? "00";
  const todayCheckIns = metrics.find((item) => item.label === "오늘 체크인")?.value ?? "00";
  const availableRooms = metrics.find((item) => item.label === "가동 객실")?.value ?? "00";

  return {
    header: {
      eyebrow: "판매자센터",
      title: "운영 워크스페이스",
      description: "실제 예약, 숙소, 문의 데이터를 기준으로 오늘 처리할 항목을 확인합니다.",
      spotlight: {
        label: "오늘 우선 확인",
        value: `${todayCheckIns}건`,
        note: "체크인 예정 예약과 답변 대기 문의를 먼저 처리합니다.",
      },
      facts: [
        { label: "답변 대기 문의", value: `${waitingInquiries}건` },
        { label: "운영 숙소", value: `${activeLodgings}곳` },
        { label: "가동 객실", value: `${availableRooms}개` },
        { label: "예약 목록", value: `${reservations.length}건` },
      ],
      links: [
        { label: "예약 관리", to: "/seller/reservations" },
        { label: "문의 관리", to: "/seller/inquiries" },
        { label: "숙소 관리", to: "/seller/lodgings" },
        { label: "객실 관리", to: "/seller/rooms" },
        { label: "이미지 관리", to: "/seller/assets" },
      ],
    },
    metrics: [
      {
        label: "오늘 체크인", value: formatMetricValue(todayCheckIns),
        trend: "실데이터", trendUp: true,
      },
      {
        label: "답변 대기 문의", value: formatMetricValue(waitingInquiries),
        alert: parseInt(waitingInquiries, 10) > 0,
        trend: "처리 필요", trendUp: false,
      },
      {
        label: "운영 숙소", value: formatMetricValue(activeLodgings),
        trend: "실데이터", trendUp: true,
      },
      {
        label: "가동 객실", value: formatMetricValue(availableRooms),
        trend: "실데이터", trendUp: true,
      },
    ],
    reservationRows: todayReservations.map((item) => ({
      no: item.no,
      guest: item.guest,
      status: item.status,
      detail: `${item.stay} · ${item.amount}`,
      to: "/seller/reservations",
    })),
    lodgingRows: lodgings.map((lodging) => ({
      region: lodging.region,
      name: lodging.name,
      status: lodging.status,
      roomSummary: `객실 ${lodging.roomCount}개`,
      inquirySummary: `문의 ${lodging.inquiryCount}건`,
      occupancy: lodging.occupancy,
      detail: `객실 ${lodging.roomCount}개 · 문의 ${lodging.inquiryCount}건 · 점유율 ${lodging.occupancy}`,
      to: "/seller/lodgings",
    })),
    trends: [],
    checklist: sellerTasks ?? [],
    quickLinks: [
      { title: "문의 관리", subtitle: "답변 대기 확인", to: "/seller/inquiries", icon: "◎", accent: "amber" },
      { title: "객실 관리", subtitle: "판매 가능 상태 확인", to: "/seller/rooms", icon: "◻", accent: "teal" },
      { title: "이미지 관리", subtitle: "대표 이미지 확인", to: "/seller/assets", icon: "▣", accent: "blue" },
      { title: "숙소 관리", subtitle: "운영 상태 점검", to: "/seller/lodgings", icon: "◆", accent: "sage" },
    ],
  };
}
