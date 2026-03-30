import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { eventBanners, participationEventBanners, promoBanners } from "../../data/homeData";
import { readAuthSession } from "../../features/auth/authSession";
import { fetchLiveEvents } from "../../services/eventService";
import { claimMyCoupon, fetchCouponCatalog, fetchMyCoupons } from "../../services/mypageService";

function buildCouponEvent(coupon, index) {
  return {
    id: `coupon-${coupon.couponNo ?? coupon.id ?? index}`,
    title: `${coupon.name}\n프로모션`,
    subtitle: `${coupon.target} 예약에 적용되는 실쿠폰입니다.`,
    action: "쿠폰 다운로드",
    href: "/lodgings?theme=deal",
    coupon,
    heroTitle: `${coupon.name}\n다운로드`,
    heroSubtitle: `${coupon.discountLabel} 혜택을 바로 쿠폰함에 추가합니다.`,
    heroEyebrow: "Live Coupon",
    heroMeta: `${coupon.target} · 실제 발급`,
    detailTitle: coupon.name,
    detailCopy: "실제 백엔드 쿠폰을 내려받아 마이페이지 쿠폰함과 바로 연결합니다.",
  };
}

export default function EventsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [claimedCoupons, setClaimedCoupons] = useState([]);
  const [couponCatalog, setCouponCatalog] = useState([]);
  const [liveEvents, setLiveEvents] = useState([]);
  const [couponNotice, setCouponNotice] = useState("");
  const session = readAuthSession();
  const couponEvents = couponCatalog.length ? couponCatalog.map(buildCouponEvent) : eventBanners;
  const selectedEventId = searchParams.get("event");
  const participationEvents = liveEvents.length ? liveEvents : participationEventBanners;
  const allEvents = [...couponEvents, ...participationEvents];
  const selectedEvent = allEvents.find((item) => item.id === selectedEventId) ?? null;
  const isClaimed = useMemo(
    () =>
      selectedEvent?.coupon
        ? claimedCoupons.some(
            (item) =>
              Number(item.id) === Number(selectedEvent.coupon.id) ||
              item.couponName === selectedEvent.coupon.couponName,
          )
        : false,
    [claimedCoupons, selectedEvent],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadEvents() {
      try {
        const rows = await fetchLiveEvents();
        if (cancelled) return;
        setLiveEvents(rows);
      } catch (error) {
        console.error("Failed to load live events.", error);
      }
    }

    loadEvents();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!session?.accessToken) {
      setClaimedCoupons([]);
      setCouponCatalog([]);
      return undefined;
    }

    let cancelled = false;

    async function loadCoupons() {
      try {
        const [issuedRows, catalogRows] = await Promise.all([fetchMyCoupons(), fetchCouponCatalog()]);
        if (cancelled) return;
        setClaimedCoupons(issuedRows);
        setCouponCatalog(catalogRows);
      } catch (error) {
        console.error("Failed to load event coupons.", error);
      }
    }

    loadCoupons();

    return () => {
      cancelled = true;
    };
  }, [session?.accessToken]);

  const openEvent = (eventId) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("event", eventId);
    setSearchParams(nextParams);
  };

  const closeEvent = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("event");
    setSearchParams(nextParams);
  };

  const handleCouponClaim = async () => {
    if (!selectedEvent?.coupon || isClaimed) return;

    try {
      const result = await claimMyCoupon(selectedEvent.coupon);
      setClaimedCoupons(result.rows);
      setCouponNotice("쿠폰이 쿠폰함에 추가되었습니다.");
      setSearchParams(new URLSearchParams(searchParams));
    } catch (error) {
      console.error("Failed to claim coupon.", error);
      setCouponNotice("쿠폰 발급에 실패했습니다.");
    }
  };

  if (selectedEvent) {
    return (
      <div className="container page-stack">
        <section className="events-detail-shell">
          <div className="events-detail-head">
            <div className="events-detail-breadcrumb">
              <button type="button" className="text-link" onClick={closeEvent}>프로모션</button>
              <span>›</span>
              <span>{selectedEvent.detailTitle}</span>
            </div>
          </div>

          <div className="events-detail-grid">
            <article className="events-detail-hero-card">
              <span className="events-detail-eyebrow">{selectedEvent.heroEyebrow}</span>
              <strong>{selectedEvent.heroTitle}</strong>
              <p>{selectedEvent.heroSubtitle}</p>
              <span className="events-detail-meta">{selectedEvent.heroMeta}</span>
              <div className="events-detail-divider" />
              <small>{selectedEvent.detailCopy}</small>
              {selectedEvent.coupon ? (
                <button
                  type="button"
                  className={`events-detail-inline-button${isClaimed ? " is-complete" : ""}`}
                  onClick={handleCouponClaim}
                >
                  {isClaimed ? `${selectedEvent.detailTitle} 발급완료` : selectedEvent.detailTitle}
                </button>
              ) : (
                <Link className="events-detail-inline-link" to={selectedEvent.href ?? "/lodgings?theme=deal"}>
                  이벤트 대상 보기
                </Link>
              )}
            </article>

            <aside className="events-detail-side">
              <div className="events-detail-coupon-box">
                <span className="events-detail-side-label">{selectedEvent.coupon ? "Coupon Download" : "Event Action"}</span>
                <strong>{selectedEvent.detailTitle}</strong>
                <p>{selectedEvent.coupon ? "프로모션 쿠폰을 내려받으면 마이페이지 쿠폰함에 바로 추가됩니다." : "참여형 이벤트는 조건 확인 후 해당 이벤트 페이지나 특가 숙소 리스트로 이동합니다."}</p>
                {selectedEvent.coupon ? (
                  <button
                    type="button"
                    className={`events-detail-download-button${isClaimed ? " is-complete" : ""}`}
                    onClick={handleCouponClaim}
                  >
                    {isClaimed ? `${selectedEvent.detailTitle} 발급완료` : selectedEvent.detailTitle}
                  </button>
                ) : (
                  <Link className="events-detail-download-button is-link" to={selectedEvent.href ?? "/lodgings?theme=deal"}>
                    {selectedEvent.action}
                  </Link>
                )}
                <div className="events-detail-side-note">
                  <span>{selectedEvent.coupon ? (couponNotice || (isClaimed ? "쿠폰함에 1장이 추가되었습니다." : "다운로드 후 쿠폰함 수량이 바로 반영됩니다.")) : "참여 후 지급되는 보상은 이벤트 조건 달성 시 반영됩니다."}</span>
                </div>
              </div>

              <div className="events-detail-coupon-preview">
                <span className="events-detail-side-label">{selectedEvent.coupon ? "My Coupon" : "Related View"}</span>
                <strong>{selectedEvent.coupon ? `보유 쿠폰 ${claimedCoupons.length}장` : "마이페이지와 연결"}</strong>
                <p>{selectedEvent.coupon ? "다운로드한 쿠폰은 마이페이지 쿠폰 메뉴에서 확인할 수 있습니다." : "이벤트 확인 후 실제 반영 상태는 마이페이지나 특가 리스트에서 이어서 봅니다."}</p>
                <Link className="coupon-action-button" to={selectedEvent.coupon ? "/my/coupons" : "/lodgings?theme=deal"}>
                  {selectedEvent.coupon ? "쿠폰함 보기" : "특가 숙소 보기"}
                </Link>
              </div>
            </aside>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="container page-stack">
      <section className="events-board">
        <div className="events-board-group">
          <div className="events-board-head">
            <h2>진행 중인 프로모션</h2>
            <Link className="text-link" to="/lodgings?theme=deal">더보기</Link>
          </div>
          <div className="events-board-grid" aria-label="진행 중인 프로모션 목록">
            {couponEvents.map((item) => (
              <button key={item.id} type="button" className="events-board-card" onClick={() => openEvent(item.id)}>
                <span className="events-board-chip">Coupon Pack</span>
                <strong>{item.title}</strong>
                <p>{item.subtitle}</p>
                <span className="events-board-cta">{item.action}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="events-board-group">
          <div className="events-board-head">
            <h2>참여형 이벤트</h2>
            <Link className="text-link" to="/lodgings?theme=deal">더보기</Link>
          </div>
          <div className="events-board-grid" aria-label="참여형 이벤트 목록">
            {participationEvents.map((item) => (
              <button key={item.id} type="button" className="events-board-card is-tall" onClick={() => openEvent(item.id)}>
                <span className="events-board-chip is-soft">Event</span>
                <strong>{item.title}</strong>
                <p>{item.subtitle}</p>
                <span className="events-board-cta">{item.action}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="home-section">
        <div className="home-section-head">
          <h2>오늘 예약이 빠른 특가</h2>
          <Link className="text-link" to="/lodgings?theme=deal">
            전체 숙소 보기
          </Link>
        </div>
        <div className="promo-grid">
          {promoBanners.map((item) => (
            <article
              key={item.title}
              className={`promo-card promo-${item.accent}`}
              style={{ backgroundImage: `linear-gradient(180deg, rgba(8, 24, 34, 0.12), rgba(8, 24, 34, 0.58)), url(${item.image})` }}
            >
              <strong>{item.title}</strong>
              <p>{item.subtitle}</p>
              <span className="promo-date">{item.date}</span>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
