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
import { fetchMyCoupons, getMyMileage } from "../../services/mypageService";

const DEFAULT_COUPON_OPTION = {
  label: "ÄíÆù ¹Ì»ç¿ë",
  discount: 0,
  discountType: "AMOUNT",
  userCouponNo: null,
  discountLabel: "ÇÒÀÎ ¾øÀ½",
};

function isPercentDiscountType(value) {
  return value === "PERCENT" || value === "RATE" || String(value ?? "").toLowerCase() === "percent";
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
              discountLabel:
                item.discountLabel ??
                (isPercentDiscountType(item.couponType ?? "AMOUNT")
                  ? `-${Number(item.discountValue ?? 0)}%`
                  : `-${Number(item.discountValue ?? 0).toLocaleString()}¿ø`),
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
  }, [authUserNo]);

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
          <strong>?ˆì•½ ?•ë³´ë¥?ë¶ˆëŸ¬?¤ëŠ” ì¤‘ì…?ˆë‹¤.</strong>
          <p>?™ì†Œ?€ ê°ì‹¤ ?°ì´?°ë? ê°€?¸ì˜¤ê³??ˆì–´??</p>
        </section>
      </div>
    );
  }

  const { selectedCoupon, selectedPayment } = getBookingSelections(form, bookingCouponOptions, bookingPaymentOptions);
  const selectedRoom = getSelectedBookingRoom(lodging, form.room);
  const { baseAmount, nightCount, serviceFee, roomTotal, couponDiscount, mileageUsed, totalAmount } = buildBookingPricing(lodging, form, selectedCoupon, mileageBalance);
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
      setSubmitError("?ˆì•½ ê°€?¥í•œ ê°ì‹¤??ì°¾ì„ ???†ìŠµ?ˆë‹¤.");
      return;
    }

    if (!form.checkIn || !form.checkOut) {
      setSubmitError("ì²´í¬?¸ê³¼ ì²´í¬?„ì›ƒ ? ì§œë¥??•ì¸??ì£¼ì„¸??");
      return;
    }

    if (!selectedPayment?.value) {
      setSubmitError("ê²°ì œ ?˜ë‹¨??? íƒ??ì£¼ì„¸??");
      return;
    }

    if (Number(form.guests ?? 0) <= 0) {
      setSubmitError("?¬ìˆ™ ?¸ì›?€ 1ëª??´ìƒ?´ì–´???©ë‹ˆ??");
      return;
    }

    if (Number(form.guests) > Number(selectedRoom.maxGuestCount ?? 0)) {
      setSubmitError(`? íƒ??ê°ì‹¤?€ ìµœë? ${selectedRoom.maxGuestCount}?¸ê¹Œì§€ ê°€?¥í•©?ˆë‹¤.`);
      return;
    }

    if (Number(form.mileageToUse ?? 0) > 0) {
      setSubmitError("ë§ˆì¼ë¦¬ì? ì°¨ê° ?€?¥ì? ?„ì§ ê²°ì œ ?°ë™ ?„ì…?ˆë‹¤. 0Pë¡?ì§„í–‰??ì£¼ì„¸??");
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
        orderName: `${lodging.name} ${selectedRoom.name} ?ˆì•½`,
        paymentAmount: bookingResponse.totalPrice,
        currency: "KRW",
        payMethod: selectedPayment.value,
        pgProvider: selectedPayment.pg,
      });

      navigate(`/my/bookings/${bookingResponse.bookingId}`);
    } catch (error) {
      const message = error?.message || "";
      if (message.includes("403") || message.includes("Forbidden")) {
        setSubmitError("?ˆì•½?€ ?¼ë°˜ ?Œì› ê³„ì •?ì„œë§?ì§„í–‰?????ˆìŠµ?ˆë‹¤.");
      } else {
        setSubmitError(toUserFacingErrorMessage(error, "?ˆì•½ ?ì„±???¤íŒ¨?ˆìŠµ?ˆë‹¤."));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container page-stack">
      <section className="booking-hero">
        <div className="booking-hero-main">
          <p className="eyebrow">?ˆì•½</p>
          <h1>{lodging.name} ?ˆì•½</h1>
          <p>{lodging.address}</p>
          <div className="feature-chip-row">
            <span className="inline-chip">ì¦‰ì‹œ ?ˆì•½ ?•ì •</span>
            <span className="inline-chip">?ˆì „ ê²°ì œ</span>
            <span className="inline-chip">{nightCount}ë°??¼ì •</span>
            <span className="inline-chip">{totalAmount.toLocaleString()}¿ø</span>
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




