import { readFileSync } from "node:fs";

const checks = [
  {
    path: "../src/features/booking/bookingViewModel.js",
    forbidden: 'value === "RATE"',
  },
  {
    path: "../src/pages/user/BookingPage.jsx",
    forbidden: 'value === "RATE"',
  },
  {
    path: "../src/services/mypageService.js",
    forbidden: 'value === "RATE"',
  },
  {
    path: "../../backend/src/main/java/com/kh/trip/service/UserCouponServiceImpl.java",
    forbidden: '"RATE".equals(coupon.getDiscountType().name())',
  },
  {
    path: "../src/services/mypageService.js",
    forbidden: "item.discountLabel ??",
  },
  {
    path: "../src/pages/user/BookingPage.jsx",
    forbidden: "item.discountLabel ??",
  },
];

const failures = [];

for (const { path, forbidden } of checks) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  if (source.includes(forbidden)) {
    failures.push(`${path}: found forbidden ${forbidden}`);
  }
}

if (failures.length) {
  console.error("RATE discount type is still present outside mileage logic:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("RATE discount type check passed.");
