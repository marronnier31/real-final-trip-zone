import { addDays, parseISO, startOfDay, toISO } from "./bookingUtils";

function isPercentDiscountType(value) {
  return value === "PERCENT" || String(value ?? "").toLowerCase() === "percent";
}

export function buildRoomLabel(room) {
  return `${room.name} · 최대 ${room.maxGuestCount}인`;
}

export function getBookingLodging(lodgings, lodgingId) {
  return lodgings.find((item) => String(item.id) === lodgingId) ?? lodgings[0];
}

export function buildRoomOptions(lodging) {
  if (Array.isArray(lodging.rooms) && lodging.rooms.length) {
    return lodging.rooms.map(buildRoomLabel);
  }
  return [lodging.room];
}

function resolveBookingDates(searchParams) {
  const today = startOfDay(new Date());
  const defaultCheckIn = addDays(today, 1);
  const rawCheckIn = parseISO(searchParams.get("checkIn"));
  const rawCheckOut = parseISO(searchParams.get("checkOut"));
  const checkInDate = rawCheckIn && rawCheckIn.getTime() >= today.getTime() ? rawCheckIn : defaultCheckIn;
  const minimumCheckOut = addDays(checkInDate, 1);
  const checkOutDate = rawCheckOut && rawCheckOut.getTime() > checkInDate.getTime() ? rawCheckOut : addDays(checkInDate, 1);

  return {
    checkIn: toISO(checkInDate),
    checkOut: toISO(checkOutDate.getTime() >= minimumCheckOut.getTime() ? checkOutDate : minimumCheckOut),
  };
}

export function getInitialBookingMonth(searchParams) {
  return parseISO(resolveBookingDates(searchParams).checkIn) ?? addDays(startOfDay(new Date()), 1);
}

export function createInitialBookingForm(searchParams, roomOptions, lodging, couponOptions, paymentOptions) {
  const initialRoom = searchParams.get("room");
  const { checkIn, checkOut } = resolveBookingDates(searchParams);
  const guests = Number(searchParams.get("guests") ?? 2);
  const matchedRoom =
    roomOptions.find((option) => option === initialRoom || option.startsWith(`${initialRoom} ·`)) ??
    lodging.room;

  return {
    checkIn,
    checkOut,
    guests: Number.isFinite(guests) && guests > 0 ? guests : 2,
    room: matchedRoom,
    couponLabel: couponOptions[0]?.label ?? "",
    paymentMethod: paymentOptions[0].value,
    mileageToUse: 0,
    request: "",
  };
}

export function getSelectedBookingRoom(lodging, roomLabel) {
  if (!Array.isArray(lodging.rooms) || !lodging.rooms.length) {
    return null;
  }

  return (
    lodging.rooms.find((room) => buildRoomLabel(room) === roomLabel || roomLabel?.startsWith(`${room.name} ·`)) ??
    lodging.rooms[0]
  );
}

export function getBookingSelections(form, couponOptions, paymentOptions) {
  return {
    selectedCoupon: couponOptions.find((item) => item.label === form.couponLabel) ?? couponOptions[0],
    selectedPayment: paymentOptions.find((item) => item.value === form.paymentMethod) ?? paymentOptions[0],
  };
}

export function buildBookingPricing(lodging, form, selectedCoupon, mileageBalance = 0, selectedRoom = null) {
  const baseAmount = Number(selectedRoom?.pricePerNight ?? String(lodging.price).replace(/[^\d]/g, ""));
  const checkInDate = new Date(form.checkIn);
  const checkOutDate = new Date(form.checkOut);
  const nightCount = Math.max(1, Math.round((checkOutDate.getTime() - checkInDate.getTime()) / 86400000));
  const guestCount = Math.max(1, Number(form.guests ?? 1));
  const serviceFee = 0;
  const roomTotal = baseAmount * nightCount * guestCount;
  const rawCouponDiscount =
    isPercentDiscountType(selectedCoupon.discountType)
      ? Math.floor((roomTotal * Number(selectedCoupon.discount ?? 0)) / 100)
      : Number(selectedCoupon.discount ?? 0);
  const couponDiscount = Math.min(rawCouponDiscount, roomTotal);
  const subtotalAmount = Math.max(roomTotal - couponDiscount + serviceFee, 0);
  const mileageRequested = Number(form.mileageToUse ?? 0);
  const mileageUsed = Math.max(0, Math.min(Number.isFinite(mileageRequested) ? mileageRequested : 0, mileageBalance, subtotalAmount));
  const totalAmount = Math.max(subtotalAmount - mileageUsed, 0);

  return {
    baseAmount,
    nightCount,
    serviceFee,
    roomTotal,
    couponDiscount,
    mileageUsed,
    subtotalAmount,
    totalAmount,
  };
}

export function getBookingCtaHref(authSession) {
  return authSession ? "/my/bookings" : "/login";
}
