import { post } from "../lib/appClient";
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
  return post("/api/mypage/bookings", payload);
}

export async function createBookingPayment(payload) {
  return post("/api/payments", payload);
}
