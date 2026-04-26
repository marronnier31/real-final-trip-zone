import { readFileSync } from "node:fs";

const checks = [
  {
    path: "src/data/bookingData.js",
    snippets: [
      "체크인과 체크아웃 날짜 확인",
      "신용/체크카드",
      "예약 정보와 요청사항은 체크인 전까지 마이페이지에서 언제든 수정할 수 있어요.",
    ],
  },
  {
    path: "src/features/booking/bookingUtils.js",
    snippets: [
      'export const WEEK_DAYS = ["일", "월", "화", "수", "목", "금", "토"]',
      "날짜를 선택해 주세요.",
      "박",
    ],
  },
  {
    path: "src/features/booking/bookingViewModel.js",
    snippets: ["최대"],
  },
  {
    path: "src/features/booking/BookingPanels.jsx",
    snippets: ["이전 달", "다음 달", "적용"],
  },
  {
    path: "src/pages/user/BookingPage.jsx",
    snippets: ["쿠폰 미사용", "예약 중 숙소 정보를 불러오는 중입니다."],
  },
  {
    path: "src/features/booking/BookingSections.jsx",
    snippets: ["체크인", "결제 수단", "로그인 후 예약이 가능합니다."],
  },
  {
    path: "src/services/bookingService.js",
    snippets: ["로그인이 필요합니다.", "예약 번호를 받지 못했습니다."],
  },
];

const failures = [];

for (const { path, snippets } of checks) {
  const source = readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  for (const snippet of snippets) {
    if (!source.includes(snippet)) {
      failures.push(`${path}: missing "${snippet}"`);
    }
  }
}

if (failures.length) {
  console.error("Booking Korean copy check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Booking Korean copy check passed.");
