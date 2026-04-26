import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import MyPageLayout from "../../components/user/MyPageLayout";
import { getPaymentSummary } from "../../features/mypage/mypageViewModels";
import {
  getCachedMyBookingsSnapshot,
  getCachedMyPaymentsSnapshot,
  getMyBookings,
  getMyPayments,
} from "../../services/mypageService";

function getPaymentStatusLabel(status) {
  if (status === "PAID") return "결제 완료";
  if (status === "READY") return "결제 대기";
  if (status === "CANCELED") return "결제 취소";
  if (status === "REFUNDED") return "환불 완료";
  return status ?? "상태 확인";
}

export default function MyPaymentsPage() {
  const cachedBookings = getCachedMyBookingsSnapshot();
  const cachedPayments = getCachedMyPaymentsSnapshot();
  const [myBookingRows, setMyBookingRows] = useState(cachedBookings);
  const [paymentHistoryRows, setPaymentHistoryRows] = useState(cachedPayments);
  const [isLoading, setIsLoading] = useState(!(cachedBookings.length && cachedPayments.length));
  const { paidCount, refundedCount, recentPaidAmount, recentRefundedAmount } = getPaymentSummary(paymentHistoryRows);

  useEffect(() => {
    let cancelled = false;

    async function loadPayments() {
      try {
        if (!(cachedBookings.length && cachedPayments.length)) {
          setIsLoading(true);
        }
        const [bookings, payments] = await Promise.all([
          getMyBookings({ force: true }),
          getMyPayments({ force: true }),
        ]);
        if (cancelled) return;
        setMyBookingRows(bookings);
        setPaymentHistoryRows(payments);
      } catch (error) {
        console.error("Failed to load my payments.", error);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadPayments();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <MyPageLayout>
      <section className="my-list-sheet account-sheet payment-sheet payment-sheet-v2">
        <div className="mypage-header-row">
          <div className="mypage-header-copy">
            <strong>결제 내역</strong>
            <p>결제수단, 결제일, 환불 상태를 최신순으로 확인합니다.</p>
          </div>
        </div>
        <div className="payment-summary-bar">
          <span>결제 완료 {paidCount}건</span>
          <span>환불 {refundedCount}건</span>
          <Link className="coupon-action-button" to="/my/bookings">예약 보기</Link>
        </div>
        <div className="payment-glance-strip">
          <div className="payment-glance-card is-mint">
            <span>최근 결제</span>
            <strong>{recentPaidAmount}</strong>
          </div>
          <div className="payment-glance-card is-soft">
            <span>최근 환불</span>
            <strong>{recentRefundedAmount}</strong>
          </div>
        </div>
        <div className="payment-row-list">
          {isLoading ? (
            <div className="my-empty-panel">
              <strong>결제 내역을 불러오는 중입니다.</strong>
              <p>예약과 결제 데이터를 함께 불러오고 있습니다.</p>
            </div>
          ) : null}
          {paymentHistoryRows.map((item) => (
            <article key={item.bookingNo} className="payment-row">
              <div className="payment-row-main">
                <div className="payment-row-copy">
                  <div className="payment-row-topline">
                    <span className={`table-code code-${item.status.toLowerCase()}`}>
                      {getPaymentStatusLabel(item.status)}
                    </span>
                    <span>{item.bookingNo}</span>
                  </div>
                  <strong>{item.lodgingName}</strong>
                  <p>{item.detail}</p>
                </div>
              </div>
              <div className="payment-row-side">
                <strong className={`payment-row-amount${item.status === "REFUNDED" ? " is-refund" : ""}`}>{item.amount}</strong>
                {(() => {
                  const booking = myBookingRows.find((row) => row.bookingId === item.bookingId);
                  return booking ? (
                    <Link className="coupon-action-button payment-action-button" to={`/my/bookings/${booking.bookingId}`}>
                      결제 상세
                    </Link>
                  ) : null;
                })()}
              </div>
            </article>
          ))}
          {!isLoading && !paymentHistoryRows.length ? (
            <div className="my-empty-panel">
              <strong>결제 내역이 없습니다.</strong>
              <p>예약 후 결제가 완료되면 여기에 기록됩니다.</p>
            </div>
          ) : null}
        </div>
      </section>
    </MyPageLayout>
  );
}
