import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import MyPageLayout from "../../components/user/MyPageLayout";
import { filterBookingRows, formatBookingStatusLabel, getBookingTabSummary } from "../../features/mypage/mypageViewModels";
import { getCachedLodgingsSnapshot, getLodgings, LODGING_FALLBACK_IMAGE } from "../../services/lodgingService";
import { getCachedMyBookingsSnapshot, getMyBookings } from "../../services/mypageService";

export default function MyBookingsPage() {
  const cachedLodgings = getCachedLodgingsSnapshot();
  const cachedBookings = getCachedMyBookingsSnapshot();
  const [tab, setTab] = useState("upcoming");
  const [lodgings, setLodgings] = useState(cachedLodgings);
  const [myBookingRows, setMyBookingRows] = useState(cachedBookings);
  const [isLoading, setIsLoading] = useState(!(cachedLodgings.length && cachedBookings.length));
  const { upcomingCount, completedCount } = getBookingTabSummary(myBookingRows);
  const filteredRows = filterBookingRows(myBookingRows, tab);
  const lodgingMap = useMemo(() => Object.fromEntries(lodgings.map((lodging) => [lodging.id, lodging])), [lodgings]);
  const formatMeta = (...parts) => parts.filter((part) => typeof part === "string" && part.trim()).join(" · ");

  useEffect(() => {
    let cancelled = false;

    async function loadBookingScreen() {
      try {
        if (!(cachedLodgings.length && cachedBookings.length)) {
          setIsLoading(true);
        }
        const [rows, bookingRows] = await Promise.all([getLodgings(), getMyBookings({ force: true })]);
        if (cancelled) return;
        setLodgings(rows);
        setMyBookingRows(bookingRows);
      } catch (error) {
        console.error("Failed to load booking lodgings.", error);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadBookingScreen();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <MyPageLayout>
      <section className="my-list-sheet booking-sheet booking-sheet-v2">
        <div className="mypage-section-top">
          <strong>예약 내역</strong>
        </div>
        <div className="mypage-guide-banner">
          <span>예약 확인, 일정 체크, 상세 이동을 한 화면에서 정리했습니다.</span>
        </div>
        <div className="booking-glance-strip">
          <div className="booking-glance-card is-mint">
            <span>예약중</span>
            <strong>{upcomingCount}건</strong>
          </div>
          <div className="booking-glance-card">
            <span>이용 완료</span>
            <strong>{completedCount}건</strong>
          </div>
          <div className="booking-glance-card is-soft">
            <span>정렬</span>
            <strong>최신 일정순</strong>
          </div>
        </div>
        <div className="payment-sheet-links booking-controls">
          <div className="booking-segmented-tabs" role="tablist" aria-label="예약 상태">
            <button
              type="button"
              className={`booking-segmented-tab${tab === "upcoming" ? " is-active" : ""}`}
              onClick={() => setTab("upcoming")}
            >
              예약중
            </button>
            <button
              type="button"
              className={`booking-segmented-tab${tab === "completed" ? " is-active" : ""}`}
              onClick={() => setTab("completed")}
            >
              이용 완료
            </button>
          </div>
        </div>
        <div className="mypage-subsection-head">
          <strong>{tab === "upcoming" ? "예정된 여행" : "이용완료 및 예약취소"}</strong>
          <span>{tab === "upcoming" ? `예약중 ${upcomingCount}건` : `이용 완료 ${completedCount}건`}</span>
        </div>
        <div className="booking-list-rows booking-list-rows--flush">
          {isLoading ? (
            <div className="my-empty-panel">
              <strong>예약 내역을 불러오는 중입니다.</strong>
              <p>백엔드 예약 데이터와 숙소 정보를 동기화하고 있습니다.</p>
            </div>
          ) : null}
          {filteredRows.map((item) => {
            const statusLabel = formatBookingStatusLabel(item.status, item.bookingStatusLabel);
            return (
            <article key={item.bookingId} className="booking-list-row">
              <div className="booking-list-media">
                <img
                  src={lodgingMap[item.lodgingId]?.image}
                  alt={item.name}
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = LODGING_FALLBACK_IMAGE;
                  }}
                />
              </div>
              <div className="booking-list-main">
                <div className="booking-list-side-topline booking-list-row-head">
                  <span className={`table-code code-${String(item.status ?? "").toLowerCase()}`}>
                    {statusLabel}
                  </span>
                  <span>{item.bookingId}</span>
                </div>
                <div className="booking-list-copy">
                  <div className="payment-row-topline">
                    <span>{tab === "completed" ? "이용 일정" : "예약 일정"} {item.stay}</span>
                    <span>{formatMeta(lodgingMap[item.lodgingId]?.region, lodgingMap[item.lodgingId]?.district)}</span>
                  </div>
                  <strong>{item.name}</strong>
                  <p>{formatMeta(lodgingMap[item.lodgingId]?.type, lodgingMap[item.lodgingId]?.room)}</p>
                </div>
              </div>
              <div className="booking-list-side">
                <strong className="booking-list-amount">{item.price}</strong>
                <div className="booking-list-copy">
                  <p>원래 금액 {item.originalAmountText}</p>
                  <p>최종결제 {item.finalAmountText}</p>
                  <p>쿠폰 {item.couponUsedText} · 마일리지 {item.mileageUsedText}</p>
                </div>
                <div className="booking-list-links">
                  <Link className="coupon-action-button booking-action-button" to={`/my/bookings/${item.bookingId}`}>
                    예약 상세
                  </Link>
                  {tab === "completed" ? (
                    <Link className="text-link" to={`/lodgings/${item.lodgingId}#reviews`}>
                      후기 작성
                    </Link>
                  ) : null}
                </div>
              </div>
            </article>
            );
          })}
          {!isLoading && !filteredRows.length ? (
            <div className="my-empty-panel">
              <strong>{tab === "upcoming" ? "예정된 여행이 없습니다." : "이용완료 내역이 없습니다."}</strong>
              <p>{tab === "upcoming" ? "지금 새로운 예약을 진행해보세요." : "숙박 완료 후 여기에 이용 기록이 표시됩니다."}</p>
              {tab === "upcoming" ? (
                <Link className="primary-button my-empty-button" to="/lodgings">
                  여행지 찾아보기
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>
    </MyPageLayout>
  );
}
