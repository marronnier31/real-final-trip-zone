import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import MyPageLayout from "../../components/user/MyPageLayout";
import { getLodgings, LODGING_FALLBACK_IMAGE } from "../../services/lodgingService";
import { cancelMyBooking, getMyBookingById, getMyPaymentByBookingId } from "../../services/mypageService";

export default function MyBookingDetailPage() {
  const { bookingId } = useParams();
  const [lodgings, setLodgings] = useState([]);
  const [booking, setBooking] = useState(null);
  const [payment, setPayment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const lodgingMap = useMemo(() => Object.fromEntries(lodgings.map((lodging) => [lodging.id, lodging])), [lodgings]);
  const formatMeta = (...parts) => parts.filter((part) => typeof part === "string" && part.trim()).join(" · ");

  useEffect(() => {
    let cancelled = false;

    async function loadBookingDetail() {
      try {
        setIsLoading(true);
        const [rows, bookingRow, paymentRow] = await Promise.all([
          getLodgings(),
          getMyBookingById(bookingId, { force: true }),
          getMyPaymentByBookingId(bookingId, { force: true }),
        ]);
        if (cancelled) return;
        setLodgings(rows);
        setBooking(bookingRow);
        setPayment(paymentRow);
      } catch (error) {
        console.error("Failed to load booking detail lodging.", error);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadBookingDetail();

    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) {
    return <MyPageLayout eyebrow="예약 상세" title="예약 상세를 불러오는 중입니다." />;
  }

  if (!booking) {
    return <MyPageLayout eyebrow="예약 상세" title="예약 정보를 찾을 수 없습니다." />;
  }

  const lodging = lodgingMap[booking.lodgingId];
  const statusLabel = booking.bookingStatusLabel ?? booking.status;
  const canCancelBooking = booking.status === "PENDING" || booking.status === "CONFIRMED";
  const overviewItems = [
    { label: "예약 일정", value: booking.stay },
    { label: "객실", value: lodging?.room ?? "객실 정보 없음" },
    { label: "결제 수단", value: payment?.detail ?? "결제 정보 없음" },
    { label: "취소 규정", value: lodging?.cancellation ?? "확인 필요" },
  ];

  const handleCancelBooking = async () => {
    const confirmed = window.confirm("예약을 취소하시겠습니까?");
    if (!confirmed) return;

    try {
      await cancelMyBooking(booking.bookingId ?? booking.bookingNo ?? bookingId);
      const [bookingRow, paymentRow] = await Promise.all([
        getMyBookingById(bookingId, { force: true }),
        getMyPaymentByBookingId(bookingId, { force: true }),
      ]);
      setBooking(bookingRow);
      setPayment(paymentRow);
      setNotice("예약 취소 신청이 완료되었습니다.");
    } catch (error) {
      console.error("Failed to cancel booking detail.", error);
      setNotice(error.message || "예약 취소를 진행하지 못했습니다.");
    }
  };

  return (
    <MyPageLayout>
      {notice ? <section className="my-page-inline-meta"><span>{notice}</span></section> : null}
      <section className="my-page-inline-meta">
        <span className={`table-code code-${booking.status.toLowerCase()}`}>{statusLabel}</span>
        <span>주문 정보 {bookingId}</span>
        <span>{payment?.detail ?? "결제 정보 확인 필요"}</span>
      </section>

      <section className="booking-detail-sheet">
        <div className="booking-detail-top">
          <div className="booking-detail-visual">
            <img
              src={lodging?.image}
              alt={booking.name}
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = LODGING_FALLBACK_IMAGE;
              }}
            />
          </div>
          <div className="booking-detail-summary">
            <span className="small-label">예약 상세</span>
            <strong>{booking.name}</strong>
            <p>{formatMeta(lodging?.district, lodging?.room)}</p>
            <div className="booking-detail-price">
              <span>결제 금액</span>
              <strong>{booking.price}</strong>
            </div>
            <div className="booking-detail-chip-row">
              <span className={`table-code code-${booking.status.toLowerCase()}`}>{statusLabel}</span>
              <span className="my-stat-pill is-soft">주문 정보 {bookingId}</span>
            </div>
          </div>
        </div>

        <div className="booking-detail-overview">
          {overviewItems.map((item) => (
            <div key={item.label} className="booking-detail-overview-item">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>

        <div className="booking-detail-grid">
          <div className="booking-detail-row">
            <span>예약 일정</span>
            <strong>{booking.stay}</strong>
          </div>
          <div className="booking-detail-row">
            <span>예약 상태</span>
            <strong>{statusLabel}</strong>
          </div>
          <div className="booking-detail-row">
            <span>객실 정보</span>
            <strong>{lodging?.room}</strong>
          </div>
          <div className="booking-detail-row">
            <span>위치</span>
            <strong>{formatMeta(lodging?.region, lodging?.district)}</strong>
          </div>
          <div className="booking-detail-row">
            <span>체크인/체크아웃</span>
            <strong>
              {lodging?.checkInTime} / {lodging?.checkOutTime}
            </strong>
          </div>
          <div className="booking-detail-row">
            <span>취소 규정</span>
            <strong>{lodging?.cancellation}</strong>
          </div>
          <div className="booking-detail-row">
            <span>결제 수단</span>
            <strong>{payment?.detail ?? "결제 정보 없음"}</strong>
          </div>
          <div className="booking-detail-row">
            <span>주문 정보</span>
            <strong>{bookingId}</strong>
          </div>
        </div>
      </section>

      <div className="booking-actions">
        <Link className="secondary-button" to="/my/bookings">
          예약 목록
        </Link>
        <Link className="secondary-button" to={`/lodgings/${booking.lodgingId}`}>
          숙소 상세 보기
        </Link>
        {canCancelBooking ? (
          <button
            type="button"
            className="danger-button secondary-button booking-cancel-button"
            onClick={handleCancelBooking}
          >
            예약 취소
          </button>
        ) : null}
        {booking.status === "COMPLETED" ? (
          <Link className="primary-button" to={`/lodgings/${booking.lodgingId}#reviews`}>
            후기 작성
          </Link>
        ) : null}
      </div>
    </MyPageLayout>
  );
}
