import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { readAuthSession } from "../../utils/authSession";
import { DateRangePopover } from "../../features/booking/BookingPanels";
import { BookingFormSection, BookingSummarySection } from "../../features/booking/BookingSections";
import {
  buildBookingPricing,
  buildRoomOptions,
  createInitialBookingForm,
  getBookingCtaHref,
  getBookingSelections,
} from "../../features/booking/bookingViewModel";
import { formatBookingDate, parseISO, toISO } from "../../features/booking/bookingUtils";
import {
  getBookingChecklist,
  getBookingCouponOptions,
  getBookingPaymentOptions,
  getBookingStatusNotes,
} from "../../services/bookingService";
import { getLodgingDetailById } from "../../services/lodgingService";

export default function BookingPage() {
  const { lodgingId } = useParams();
  const [searchParams] = useSearchParams();
  const [lodging, setLodging] = useState(null);
  const bookingChecklist = getBookingChecklist();
  const bookingCouponOptions = getBookingCouponOptions();
  const bookingPaymentOptions = getBookingPaymentOptions();
  const bookingStatusNotes = getBookingStatusNotes();
  const authSession = readAuthSession();
  const roomOptions = useMemo(() => (lodging ? buildRoomOptions(lodging) : []), [lodging]);
  const [form, setForm] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);
  const checkInRef = useRef(null);
  const checkOutRef = useRef(null);
  const calendarPanelRef = useRef(null);
  const [visibleMonth, setVisibleMonth] = useState(parseISO(searchParams.get("checkIn") ?? "2026-03-01") ?? new Date());

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
          <p>숙소와 객실 데이터를 가져오고 있어요.</p>
        </section>
      </div>
    );
  }

  const { selectedCoupon, selectedPayment } = getBookingSelections(form, bookingCouponOptions, bookingPaymentOptions);
  const { baseAmount, nightCount, serviceFee, roomTotal, totalAmount } = buildBookingPricing(lodging, form, selectedCoupon);
  const ctaHref = getBookingCtaHref(authSession);

  const handleDatePick = (day) => {
    const picked = toISO(day);
    if (openMenu === "date-start") {
      setForm((current) => ({
        ...current,
        checkIn: picked,
        checkOut: current.checkOut && current.checkOut <= picked ? "" : current.checkOut,
      }));
      return;
    }

    setForm((current) => ({
      ...current,
      checkOut: picked <= current.checkIn ? current.checkIn : picked,
    }));
  };

  return (
    <div className="container page-stack">
      <section className="booking-hero">
        <div className="booking-hero-main">
          <p className="eyebrow">예약</p>
          <h1>{lodging.name} 예약</h1>
          <p>{lodging.address}</p>
          <div className="feature-chip-row">
            <span className="inline-chip">예약 상태 PENDING</span>
            <span className="inline-chip">결제 상태 READY</span>
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
            />
          </div>

          <aside className="booking-column booking-sidebar">
            <BookingSummarySection
              lodging={lodging}
              baseAmount={baseAmount}
              nightCount={nightCount}
              roomTotal={roomTotal}
              serviceFee={serviceFee}
              totalAmount={totalAmount}
              form={form}
              selectedCoupon={selectedCoupon}
              selectedPayment={selectedPayment}
              bookingStatusNotes={bookingStatusNotes}
              authSession={authSession}
              ctaHref={ctaHref}
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
