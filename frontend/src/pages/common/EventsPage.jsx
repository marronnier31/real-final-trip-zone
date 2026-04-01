import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { eventBanners, promoBanners } from "../../data/homeData";
import { readAuthSession } from "../../features/auth/authSession";
import { fetchLiveEvents } from "../../services/eventService";

export default function EventsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [liveEvents, setLiveEvents] = useState([]);
  const [eventNotice, setEventNotice] = useState("");
  const isLoggedIn = Boolean(readAuthSession()?.accessToken);
  const couponRows = eventBanners.map((item) => ({
    ...item,
    entityType: "COUPON",
    heroEyebrow: item.heroEyebrow ?? "Coupon Benefit",
    heroMeta: item.heroMeta ?? item.date,
    detailTitle: item.detailTitle ?? item.title,
    detailCopy: item.detailCopy ?? item.subtitle,
    imageUrl: item.image,
    periodLabel: item.date,
    ctaHref: isLoggedIn ? "/my/coupons" : "/login",
    ctaLabel: isLoggedIn ? "쿠폰함 보기" : "로그인 후 쿠폰 확인",
  }));
  const promoRows = [...liveEvents, ...couponRows];
  const selectedEventId = searchParams.get("event");
  const selectedEvent = promoRows.find((item) => item.id === selectedEventId) ?? null;

  useEffect(() => {
    let cancelled = false;

    async function loadEvents() {
      try {
        const rows = await fetchLiveEvents();
        if (cancelled) return;
        setLiveEvents(rows);
      } catch (error) {
        console.error("Failed to load live events.", error);
        setEventNotice("이벤트 목록을 불러오지 못했습니다.");
      }
    }

    loadEvents();

    return () => {
      cancelled = true;
    };
  }, []);

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
              <Link className="events-detail-inline-link" to={selectedEvent.href ?? "/lodgings?theme=deal"}>
                {selectedEvent.entityType === "COUPON" ? "혜택 적용 숙소 보기" : "이벤트 대상 보기"}
              </Link>
            </article>

            <aside className="events-detail-side">
              <div className="events-detail-coupon-box">
                <span className="events-detail-side-label">Promotion Action</span>
                <strong>{selectedEvent.detailTitle}</strong>
                <p>
                  {selectedEvent.entityType === "COUPON"
                    ? "쿠폰형 프로모션은 혜택 대상 숙소와 쿠폰함 흐름으로 바로 이어집니다."
                    : "프로모션 카드를 누르면 바로 대상 숙소나 특가 리스트로 이어집니다."}
                </p>
                <Link
                  className="events-detail-download-button is-link"
                  to={selectedEvent.ctaHref ?? selectedEvent.href ?? "/lodgings?theme=deal"}
                >
                  {selectedEvent.ctaLabel ?? selectedEvent.action ?? "이벤트 대상 보기"}
                </Link>
                <div className="events-detail-side-note">
                  <span>
                    {selectedEvent.entityType === "COUPON"
                      ? "로그인 후 쿠폰함과 특가 숙소 탐색으로 바로 이어집니다."
                      : "프로모션 상세 확인 후 바로 예약 탐색으로 이어집니다."}
                  </span>
                </div>
              </div>

              <div className="events-detail-coupon-preview">
                <span className="events-detail-side-label">{selectedEvent.entityType === "COUPON" ? "Coupon Flow" : "Related View"}</span>
                <strong>{selectedEvent.entityType === "COUPON" ? "쿠폰함 / 적용 숙소" : "특가 숙소 보기"}</strong>
                <p>
                  {selectedEvent.entityType === "COUPON"
                    ? "쿠폰 프로모션은 쿠폰함과 적용 대상 숙소 리스트를 바로 확인할 수 있게 연결합니다."
                    : "프로모션 확인 후 실제 반영 상태는 특가 리스트와 숙소 상세에서 이어서 봅니다."}
                </p>
                <Link className="coupon-action-button" to={selectedEvent.href ?? "/lodgings?theme=deal"}>
                  {selectedEvent.entityType === "COUPON" ? "적용 숙소 보기" : "대상 페이지 이동"}
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
      <section className="home-section">
        <div className="home-section-head">
          <h2>프로모션</h2>
          <Link className="text-link" to="/lodgings?theme=deal">
            대상 숙소 보기
          </Link>
        </div>
        <div className="promo-grid">
          {(promoRows.length ? promoRows : promoBanners).map((item, index) => (
            <button
              key={item.id ?? item.title}
              type="button"
              className={`promo-card promo-${item.accent ?? "sunset"}`}
              style={{
                backgroundImage: `linear-gradient(180deg, rgba(8, 24, 34, 0.12), rgba(8, 24, 34, 0.58)), url(${item.imageUrl || item.image || promoBanners[index % promoBanners.length]?.image})`,
              }}
              onClick={() => openEvent(item.id)}
            >
              <strong>{item.title}</strong>
              <p>{item.subtitle ?? item.content ?? "이벤트 상세 내용을 확인해 주세요."}</p>
              <span className="promo-date">{item.periodLabel ?? item.date}</span>
            </button>
          ))}
        </div>
        {!promoRows.length ? <div className="my-empty-inline">{eventNotice || "현재 진행 중인 프로모션이 없습니다."}</div> : null}
      </section>
    </div>
  );
}
