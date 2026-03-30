import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import MyPageLayout from "../../components/user/MyPageLayout";
import {
  myBookingRows,
  myPageSections,
  myProfileSummary,
  paymentHistoryRows,
  wishlistRows,
} from "../../data/mypageData";
import { getMyCoupons, getMyHome } from "../../services/mypageService";

export default function MyPageHomePage() {
  const [homeData, setHomeData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadMyHome() {
      try {
        setIsLoading(true);
        const response = await getMyHome();
        if (cancelled) return;
        setHomeData(response);
      } catch (error) {
        console.error("Failed to load mypage home.", error);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadMyHome();

    return () => {
      cancelled = true;
    };
  }, []);

  const coupons = getMyCoupons();
  const fallbackUpcomingCount = myBookingRows.filter((item) => item.status !== "COMPLETED").length;
  const fallbackAvailableCouponCount = coupons.filter((item) => item.status === "사용 가능").length;
  const fallbackPaidCount = paymentHistoryRows.filter((item) => item.status === "PAID").length;
  const fallbackNextTrip = myBookingRows.find((item) => item.status !== "COMPLETED") ?? myBookingRows[0];
  const profileSummary = homeData?.profileSummary ?? myProfileSummary;
  const overview = homeData?.overview;
  const upcomingCount = overview?.upcomingBookingCount ?? fallbackUpcomingCount;
  const availableCouponCount = overview?.availableCouponCount ?? fallbackAvailableCouponCount;
  const paidCount = overview?.paidCount ?? fallbackPaidCount;
  const overviewItems = [
    { label: "예약중", value: `${upcomingCount}건`, href: "/my/bookings" },
    { label: "찜 목록", value: `${overview?.wishlistCount ?? wishlistRows.length}건`, href: "/my/wishlist" },
    { label: "사용 가능 쿠폰", value: `${availableCouponCount}장`, href: "/my/coupons" },
    { label: "결제 완료", value: `${paidCount}건`, href: "/my/payments" },
  ];
  const nextTrip = useMemo(() => fallbackNextTrip, [fallbackNextTrip]);
  const shortcutItems = useMemo(() => {
    const menuMap = new Map((homeData?.menus ?? []).map((item) => [item.href, item]));
    return myPageSections.map((item) => ({
      ...item,
      title: menuMap.get(item.href)?.title ?? item.title,
      subtitle: menuMap.get(item.href)?.subtitle ?? item.subtitle,
    }));
  }, [homeData?.menus]);

  return (
    <MyPageLayout>
      <section className="my-list-sheet my-home-sheet">
        {isLoading ? (
          <div className="my-empty-panel">
            <strong>마이페이지 요약을 불러오는 중입니다.</strong>
            <p>회원 요약 정보와 바로가기 메뉴를 동기화하고 있습니다.</p>
          </div>
        ) : null}
        <section className="my-home-hero">
          <Link to="/my/membership" className="my-home-topline my-home-topline-link">
            <div className="my-home-topline-copy">
              <span className="my-home-label">MY PAGE</span>
              <strong>{profileSummary.name}</strong>
              <p>{profileSummary.gradeHint}</p>
            </div>
            <div className="my-home-topline-meta">
              <span className="my-stat-pill is-mint">{profileSummary.status}</span>
              <span className="my-stat-pill">{profileSummary.grade} 회원</span>
              <span className="my-stat-pill is-soft">{profileSummary.joinedAt}</span>
            </div>
          </Link>

          <Link to="/my/bookings" className="my-home-trip-card">
            <div className="my-home-trip-copy">
              <span className="my-home-label">다음 여행</span>
              <strong>{nextTrip.name}</strong>
              <p>{nextTrip.stay} · {nextTrip.roomName}</p>
            </div>
            <div className="my-home-trip-meta">
              <span className={`table-code code-${nextTrip.status.toLowerCase()}`}>{nextTrip.bookingStatusLabel}</span>
              <strong>{nextTrip.price}</strong>
              <span>{nextTrip.guestCount}인 · 예약 상세로 이동</span>
            </div>
          </Link>
        </section>

        <section className="my-home-overview" aria-label="마이페이지 요약">
          {overviewItems.map((item) => (
            <Link key={item.label} to={item.href} className="my-home-overview-item">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </Link>
          ))}
        </section>

        <section className="my-home-section">
          <div className="my-home-section-head">
            <div>
              <strong>지금 바로 가는 메뉴</strong>
              <p>예약 확인, 혜택 확인, 계정 정리를 첫 화면에서 바로 이어간다.</p>
            </div>
          </div>
          <div className="my-home-shortcut-grid">
            {shortcutItems.map((item) => (
              <Link key={item.href} to={item.href} className={`my-home-shortcut-card is-${item.accent}`}>
                <span className={`my-home-shortcut-icon is-${item.accent}`} aria-hidden="true">{item.icon}</span>
                <div className="my-home-shortcut-copy">
                  <strong>{item.title}</strong>
                  <p>{item.subtitle}</p>
                </div>
                <span className="my-home-shortcut-arrow">바로가기 →</span>
              </Link>
            ))}
          </div>
        </section>
      </section>
    </MyPageLayout>
  );
}
