import { get, post } from "../lib/appClient";
import { readAuthSession } from "../features/auth/authSession";
import {
  bookingChecklist,
  bookingPaymentOptions,
  bookingStatusNotes,
} from "../data/bookingData";

// Current backend note:
// /api/booking, bookingNo, roomNo, userCouponNo.
// Convert backend DTOs to bookingId, roomId, userCouponId shape in this service.

export function getBookingChecklist() {
  return bookingChecklist;
}

export function getBookingPaymentOptions() {
  return bookingPaymentOptions;
}

export function getBookingStatusNotes() {
  return bookingStatusNotes;
}

export async function createBookingReservation(payload) {
  const session = readAuthSession();
  if (!session?.userNo) {
    throw new Error("로그인이 필요합니다.");
  }

  const createResponse = await post("/api/booking/", {
    ...payload,
    userNo: session.userNo,
  });

  const bookingNo = createResponse?.result;
  if (!bookingNo) {
    throw new Error("예약 번호를 받지 못했습니다.");
  }

  const booking = await get(`/api/booking/${bookingNo}`);
  return {
    ...booking,
    bookingNo,
    bookingId: booking.bookingId ?? (booking.bookingNo != null ? `B-${booking.bookingNo}` : `B-${bookingNo}`),
  };
}

export async function createBookingPayment(payload) {
  return post("/api/payments", payload);
}
