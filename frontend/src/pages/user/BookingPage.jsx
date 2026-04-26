import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { readAuthSession } from "../../utils/authSession";
import { DateRangePopover } from "../../features/booking/BookingPanels";
import { BookingFormSection, BookingSummarySection } from "../../features/booking/BookingSections";
import {
  buildBookingPricing,
  buildRoomOptions,
  createInitialBookingForm,
  getInitialBookingMonth,
  getBookingSelections,
  getSelectedBookingRoom,
} from "../../features/booking/bookingViewModel";
import { addDays, formatBookingDate, parseISO, startOfDay, toISO } from "../../features/booking/bookingUtils";
import {
  createBookingPayment,
  createBookingReservation,
  getBookingChecklist,
  getBookingPaymentOptions,
  getBookingStatusNotes,
} from "../../services/bookingService";
import { toUserFacingErrorMessage } from "../../lib/appClient";
import { getLodgingDetailById } from "../../services/lodgingService";
import { fetchMyCoupons, getMyMileage, invalidateMyPageCaches } from "../../services/mypageService";

const DEFAULT_COUPON_OPTION = {
  label: "\uCFE0\uD3F0 \uBBF8\uC0AC\uC6A9",
  discount: 0,
  discountType: "AMOUNT",
  userCouponNo: null,
  discountLabel: "\uD560\uC778 \uC5C6\uC74C",
};

function isPercentDiscountType(value) {
  return value === "PERCENT" || String(value ?? "").toLowerCase() === "percent";
}

function formatCouponDiscountLabel(discountType, discountValue) {
  return isPercentDiscountType(discountType)
    ? `-${Number(discountValue ?? 0)}%`
    : `-${Number(discountValue ?? 0).toLocaleString()}\uC6D0`;
}

export default function BookingPage() {
  const navigate = useNavigate();
  const { lodgingId } = useParams();
  const [searchParams] = useSearchParams();
  const [lodging, setLodging] = useState(null);
  const bookingChecklist = getBookingChecklist();
  const [bookingCouponOptions, setBookingCouponOptions] = useState([DEFAULT_COUPON_OPTION]);
  const bookingPaymentOptions = getBookingPaymentOptions();
  const bookingStatusNotes = getBookingStatusNotes();
  const authSession = useMemo(() => readAuthSession(), []);
  const authUserNo = authSession?.userNo ?? null;
  const roomOptions = useMemo(() => (lodging ? buildRoomOptions(lodging) : []), [lodging]);
  const [form, setForm] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);
  const [mileageBalance, setMileageBalance] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const checkInRef = useRef(null);
  const checkOutRef = useRef(null);
  const calendarPanelRef = useRef(null);
  const [visibleMonth, setVisibleMonth] = useState(getInitialBookingMonth(searchParams));

  useEffect(() => {
    let cancelled = false;

    async function loadLodging() {
      try {
        const nextLodging = await getLodgingDetailById(lodgingId);
        if (cancelled) return;
        setLodging(nextLodging);
      } catch (error) {
        console.error("Failed to load booking lodging.", error);
      }
    }

    loadLodging();

    return () => {
      cancelled = true;
    };
  }, [lodgingId]);

  useEffect(() => {
    if (!lodging || !roomOptions.length) return;
    setForm(createInitialBookingForm(searchParams, roomOptions, lodging, bookingCouponOptions, bookingPaymentOptions));
  }, [bookingCouponOptions, bookingPaymentOptions, lodging, roomOptions, searchParams]);

  useEffect(() => {
    let cancelled = false;

    async function loadBookingBenefits() {
      if (!authSession) {
        setMileageBalance(0);
        setBookingCouponOptions([DEFAULT_COUPON_OPTION]);
        return;
      }

      try {
        const [mileageResponse, couponRows] = await Promise.all([getMyMileage(), fetchMyCoupons()]);
        if (cancelled) return;

        setMileageBalance(Number(mileageResponse.summary?.balance ?? 0));
        setBookingCouponOptions([
          DEFAULT_COUPON_OPTION,
          ...couponRows
            .filter((item) => item.isUsable)
            .map((item) => ({
              label: item.name,
              discount: Number(item.discountValue ?? 0),
              discountType: item.couponType ?? "AMOUNT",
              userCouponNo: item.userCouponId ?? item.id,
              discountLabel: formatCouponDiscountLabel(item.couponType, item.discountValue),
            })),
        ]);
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load booking benefits.", error);
          setMileageBalance(0);
          setBookingCouponOptions([DEFAULT_COUPON_OPTION]);
        }
      }
    }

    loadBookingBenefits();

    return () => {
      cancelled = true;
    };
  }, [authSession, authUserNo]);

  useEffect(() => {
    if (!form) return;

    const maxMileage = Number.isFinite(mileageBalance) ? mileageBalance : 0;
    if (form.mileageToUse <= maxMileage) return;
    setForm((current) => ({ ...current, mileageToUse: maxMileage }));
  }, [form, mileageBalance]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      const dateAnchor = openMenu === "date-start" ? checkInRef.current : checkOutRef.current;
      if (
        dateAnchor &&
        !dateAnchor.contains(event.target) &&
        (!calendarPanelRef.current || !calendarPanelRef.current.contains(event.target))
      ) {
        if (openMenu === "date-start" || openMenu === "date-end") {
          setOpenMenu(null);
        }
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [openMenu]);

  if (!lodging || !form) {
    return (
      <div className="container page-stack">
        <section className="list-empty-state list-empty-state-full">
          <strong>예약 정보를 불러오는 중입니다.</strong>
          <p>숙소와 객실 정보를 가져오고 있어요.</p>
        </section>
      </div>
    );
  }

  const { selectedCoupon, selectedPayment } = getBookingSelections(form, bookingCouponOptions, bookingPaymentOptions);
  const selectedRoom = getSelectedBookingRoom(lodging, form.room);
  const { baseAmount, nightCount, serviceFee, roomTotal, couponDiscount, mileageUsed, totalAmount } = buildBookingPricing(
    lodging,
    form,
    selectedCoupon,
    mileageBalance,
    selectedRoom
  );
  const canSubmit = Boolean(authSession && selectedRoom && !isSubmitting);

  const handleDatePick = (day) => {
    const today = startOfDay(new Date());
    if (day.getTime() < today.getTime()) return;

    const picked = toISO(day);
    if (openMenu === "date-start") {
      const nextCheckOut = addDays(day, 1);
      setForm((current) => ({
        ...current,
        checkIn: picked,
        checkOut: current.checkOut && current.checkOut > picked ? current.checkOut : toISO(nextCheckOut),
      }));
      return;
    }

    const minimumCheckOut = addDays(parseISO(form.checkIn) ?? day, 1);
    setForm((current) => ({
      ...current,
      checkOut: picked <= current.checkIn ? toISO(minimumCheckOut) : picked,
    }));
  };

  const handleSubmit = async () => {
    if (!authSession) {
      navigate("/login");
      return;
    }

    if (!selectedRoom) {
      setSubmitError("예약 가능한 객실을 찾을 수 없습니다.");
      return;
    }

    if (!form.checkIn || !form.checkOut) {
      setSubmitError("체크인과 체크아웃 날짜를 확인해 주세요.");
      return;
    }

    if (!selectedPayment?.value) {
      setSubmitError("결제 수단을 선택해 주세요.");
      return;
    }

    if (Number(form.guests ?? 0) <= 0) {
      setSubmitError("투숙 인원은 1명 이상이어야 합니다.");
      return;
    }

    if (Number(form.guests) > Number(selectedRoom.maxGuestCount ?? 0)) {
      setSubmitError(`선택한 객실은 최대 ${selectedRoom.maxGuestCount}명까지 가능합니다.`);
      return;
    }

    if (Number(form.mileageToUse ?? 0) > 0) {
      setSubmitError("마일리지 차감 기능은 아직 결제 연동 전입니다. 0P로 진행해 주세요.");
      return;
    }

    setSubmitError("");
    setIsSubmitting(true);

    try {
      const bookingResponse = await createBookingReservation({
        roomNo: selectedRoom.roomId,
        userCouponNo: selectedCoupon.userCouponNo ?? null,
        checkInDate: `${form.checkIn}T${lodging.checkInTime ?? "15:00"}:00`,
        checkOutDate: `${form.checkOut}T${lodging.checkOutTime ?? "11:00"}:00`,
        guestCount: Number(form.guests),
        requestMessage: form.request?.trim() || null,
      });

      await createBookingPayment({
        bookingNo: bookingResponse.bookingNo,
        paymentId: `PAY-${bookingResponse.bookingNo}-${Date.now()}`,
        storeId: "tripzone-local",
        channelKey: selectedPayment.value,
        orderName: `${lodging.name} ${selectedRoom.name} 예약`,
        paymentAmount: bookingResponse.totalPrice,
        currency: "KRW",
        payMethod: selectedPayment.value,
        pgProvider: selectedPayment.pg,
      });

      invalidateMyPageCaches();
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem("tripzone-my-bookings");
      }

      navigate(`/my/bookings/${bookingResponse.bookingId}`);
    } catch (error) {
      const message = error?.message || "";
      if (message.includes("403") || message.includes("Forbidden")) {
        setSubmitError("예약은 일반 회원 계정에서 진행해 주세요.");
      } else {
        setSubmitError(toUserFacingErrorMessage(error, "예약 생성에 실패했습니다."));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container page-stack">
      <section className="booking-hero">
        <div className="booking-hero-main">
          <p className="eyebrow">예약</p>
          <h1>{lodging.name} 예약</h1>
          <p>{lodging.address}</p>
          <div className="feature-chip-row">
            <span className="inline-chip">즉시 예약 확정</span>
            <span className="inline-chip">사전 결제</span>
            <span className="inline-chip">{nightCount}박 일정</span>
            <span className="inline-chip">{totalAmount.toLocaleString()}원</span>
          </div>
        </div>
      </section>

      <section className="booking-section">
        <div className="booking-layout">
          <div className="booking-column">
            <BookingFormSection
              authSession={authSession}
              bookingChecklist={bookingChecklist}
              checkInRef={checkInRef}
              checkOutRef={checkOutRef}
              form={form}
              setForm={setForm}
              openMenu={openMenu}
              setOpenMenu={(next) => {
                if (typeof next === "function") {
                  setOpenMenu((current) => {
                    const result = next(current);
                    if (result === "date-start" || result === "date-end") {
                      setVisibleMonth(parseISO(form.checkIn) ?? new Date());
                    }
                    return result;
                  });
                  return;
                }
                if (next === "date-start" || next === "date-end") {
                  setVisibleMonth(parseISO(form.checkIn) ?? new Date());
                }
                setOpenMenu(next);
              }}
              selectedCoupon={selectedCoupon}
              selectedPayment={selectedPayment}
              roomOptions={roomOptions}
              bookingCouponOptions={bookingCouponOptions}
              bookingPaymentOptions={bookingPaymentOptions}
              formatBookingDate={formatBookingDate}
              mileageBalance={mileageBalance}
            />
          </div>

          <aside className="booking-column booking-sidebar">
            <BookingSummarySection
              lodging={lodging}
              baseAmount={baseAmount}
              nightCount={nightCount}
              roomTotal={roomTotal}
              couponDiscount={couponDiscount}
              serviceFee={serviceFee}
              mileageUsed={mileageUsed}
              totalAmount={totalAmount}
              form={form}
              selectedCoupon={selectedCoupon}
              selectedPayment={selectedPayment}
              bookingStatusNotes={bookingStatusNotes}
              authSession={authSession}
              canSubmit={canSubmit}
              isSubmitting={isSubmitting}
              submitError={submitError}
              onSubmit={handleSubmit}
            />
          </aside>
        </div>
      </section>

      <DateRangePopover
        open={openMenu === "date-start" || openMenu === "date-end"}
        anchorRef={openMenu === "date-start" ? checkInRef : checkOutRef}
        panelRef={calendarPanelRef}
        visibleMonth={visibleMonth}
        setVisibleMonth={setVisibleMonth}
        checkIn={form.checkIn}
        checkOut={form.checkOut}
        onPick={handleDatePick}
        onClose={() => setOpenMenu(null)}
      />
    </div>
  );
}
