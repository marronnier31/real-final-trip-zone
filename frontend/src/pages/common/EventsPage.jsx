import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { readAuthSession } from "../../features/auth/authSession";
import { downloadEventCoupons, fetchLiveEvents } from "../../services/eventService";

export default function EventsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [liveEvents, setLiveEvents] = useState([]);
  const [eventNotice, setEventNotice] = useState("");
  const [isCouponDownloading, setIsCouponDownloading] = useState(false);
  const isLoggedIn = Boolean(readAuthSession()?.accessToken);
  const selectedEventId = searchParams.get("event");
  const selectedEvent = liveEvents.find((item) => item.id === selectedEventId) ?? null;

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
    setEventNotice("");
  };

  const closeEvent = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("event");
    setSearchParams(nextParams);
    setEventNotice("");
  };

  const handleCouponDownload = async () => {
    if (!selectedEvent) return;

    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    try {
      setIsCouponDownloading(true);
      setEventNotice("");
      const result = await downloadEventCoupons(selectedEvent.eventNo);

      if (!result.totalCount) {
        setEventNotice("다운로드할 쿠폰이 없습니다.");
      } else if (!result.downloadedCount) {
        setEventNotice("이미 받은 쿠폰이거나 저장 가능한 쿠폰이 없습니다.");
      } else {
        setEventNotice(`쿠폰 ${result.downloadedCount}장을 저장했습니다.`);
      }
    } catch (error) {
      console.error("Failed to download event coupons.", error);
      setEventNotice("쿠폰 다운로드에 실패했습니다.");
    } finally {
      setIsCouponDownloading(false);
    }
  };

  if (selectedEvent) {
    return (
      <div className="container page-stack">
        <section className="events-detail-shell">
          <div className="events-detail-head">
            <div className="events-detail-breadcrumb">
              <button type="button" className="text-link" onClick={closeEvent}>프로모션</button>
              <span>/</span>
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
                  이벤트에 연결된 쿠폰을 한 번에 저장하고 바로 쿠폰함에서 확인할 수 있습니다.
                </p>
                <button
                  type="button"
                  className="events-detail-download-button"
                  onClick={handleCouponDownload}
                  disabled={isCouponDownloading}
                >
                  {isCouponDownloading ? "다운로드 중..." : "쿠폰 다운로드"}
                </button>
                <div className="events-detail-side-note">
                  <span>
                    이벤트에 연결된 쿠폰만 기존 usercoupon 저장 방식으로 발급합니다.
                  </span>
                  {eventNotice ? <span>{eventNotice}</span> : null}
                </div>
              </div>

              <div className="events-detail-coupon-preview">
                <span className="events-detail-side-label">Related View</span>
                <strong>관련 숙소 보기</strong>
                <p>
                  프로모션 확인 후 실제 반영 상태는 숙소 리스트나 쿠폰함에서 이어서 볼 수 있습니다.
                </p>
                <Link className="coupon-action-button" to={selectedEvent.href ?? "/lodgings?theme=deal"}>
                  대상 페이지 이동
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
          {liveEvents.map((item) => (
            <button
              key={item.id ?? item.title}
              type="button"
              className={`promo-card promo-${item.accent ?? "sunset"}`}
              style={{
                backgroundImage: `linear-gradient(180deg, rgba(8, 24, 34, 0.12), rgba(8, 24, 34, 0.58)), url(${item.imageUrl || item.image})`,
              }}
              onClick={() => openEvent(item.id)}
            >
              <strong>{item.title}</strong>
              <p>{item.subtitle ?? item.content ?? "이벤트 상세 내용을 확인해 주세요."}</p>
              <span className="promo-date">{item.periodLabel ?? item.date}</span>
            </button>
          ))}
        </div>
        {!liveEvents.length ? <div className="my-empty-inline">{eventNotice || "현재 진행 중인 프로모션이 없습니다."}</div> : null}
      </section>
    </div>
  );
}
