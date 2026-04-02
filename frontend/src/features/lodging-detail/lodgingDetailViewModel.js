export function getLodgingDetail(lodgings, lodgingId) {
  return lodgings.find((item) => String(item.id) === lodgingId) ?? lodgings[0];
}

export function buildPropertyStory(lodging) {
  const stories = {
    1: [
      "해운대 바다를 가까이에서 마주할 수 있는 오션프론트 호텔로, 객실과 라운지에서 시간대마다 달라지는 해변 풍경을 즐길 수 있습니다.",
      "도보 3분 거리의 해변 접근성과 조식 포함 구성 덕분에 짧은 1박 일정부터 주말 여행까지 부담 없이 머물기 좋습니다.",
      "오션뷰 객실 즉시 확정과 24시간 프런트 운영으로 체크인 동선이 안정적이며, 전망 만족도가 특히 높은 숙소입니다.",
    ],
    2: [
      "제주의 돌담과 숲길 사이에 자리한 독채 숙소로, 바깥 동선의 간섭 없이 조용한 체류를 원하는 여행자에게 잘 맞습니다.",
      "독립 마당과 바비큐 존이 함께 구성되어 있어 가족 여행이나 소규모 프라이빗 스테이에 편안한 분위기를 제공합니다.",
      "연박 시 바비큐 세트 제공과 여유로운 공간 구성이 강점이며, 애월권 여행 동선과도 자연스럽게 연결됩니다.",
    ],
    3: [
      "바다를 정면으로 바라보는 리조트형 숙소로, 객실과 라운지에서 강릉 해변의 개방감을 길게 누릴 수 있습니다.",
      "인피니티풀과 오션 라운지가 함께 운영되어 짧은 일정에도 휴양지 같은 분위기를 빠르게 체감할 수 있습니다.",
      "주중 예약 시 라운지 쿠폰이 제공되어 조식과 휴식 동선을 한 번에 묶기 좋고, 1박 일정 만족도가 높은 편입니다.",
    ],
    4: [
      "성수의 카페 거리와 도심 라이프스타일을 가까이에서 즐길 수 있는 부티크 호텔로, 짧은 시티 스테이에 잘 어울립니다.",
      "루프탑 라운지와 셀프 체크인 구성이 함께 있어 도착부터 체크아웃까지 간결한 동선으로 이용할 수 있습니다.",
      "주말 체크인 고객 웰컴 드링크와 도심 접근성이 강점이며, 한강과 성수 상권을 함께 즐기기 좋은 위치입니다.",
    ],
    5: [
      "여수 바다와 노을을 함께 감상할 수 있는 마리나 스테이로, 객실 안에서도 항구 풍경의 분위기를 온전히 느낄 수 있습니다.",
      "테라스 스위트 구성과 웰컴 플래터 혜택이 더해져 커플 여행이나 기념일 숙소로 선택하기 좋은 편입니다.",
      "주요 관광 동선과도 가까워 저녁에는 숙소 풍경을, 낮에는 오동도와 해안 일정을 묶기 좋습니다.",
    ],
    6: [
      "경주의 한옥 감성을 현대적으로 정리한 스테이로, 온돌룸 중심의 차분한 분위기에서 여유로운 체류를 즐길 수 있습니다.",
      "체크인 고객 전통차 제공과 한옥 마당 분위기가 함께 어우러져 관광보다 휴식에 초점을 둔 일정에도 잘 어울립니다.",
      "황리단길과 주요 문화 유적 동선이 가까워 산책과 숙박을 자연스럽게 연결할 수 있는 점이 장점입니다.",
    ],
  };

  return stories[lodging.id] ?? [lodging.intro, lodging.review, `${lodging.benefit} ${lodging.highlights.slice(0, 2).join(" · ")}`];
}

export function buildRoomOptions(lodging) {
  const rooms = Array.isArray(lodging.rooms) ? lodging.rooms : [];

  return rooms.map((room, index) => ({
    id: room.roomId ?? `${lodging.id}-${index}`,
    name: room.name,
    image: room.imageUrls?.[0] ?? lodging.image,
    price: room.price,
    originalPrice: "",
    badge: index === 0 ? "기본가" : room.type ?? "객실",
    description: room.description?.trim() || lodging.highlights.slice(0, 2).join(" · "),
    maxGuestCount: room.maxGuestCount ?? 2,
    roomCount: room.roomCount ?? 1,
  }));
}

export function getReviewAverage(reviews) {
  if (!reviews.length) return "0.0";
  return (reviews.reduce((sum, item) => sum + Number(item.score), 0) / reviews.length).toFixed(1);
}

export function canWriteLodgingReview(authSession, myBookingRows, lodgingId) {
  const hasCompletedBooking = myBookingRows.some((booking) => booking.lodgingId === lodgingId && booking.status === "COMPLETED");
  return Boolean(authSession) && (authSession?.reviewEligibleLodgingIds?.includes(lodgingId) || hasCompletedBooking);
}
