import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import MyPageLayout from "../../components/user/MyPageLayout";
import { getLodgings } from "../../services/lodgingService";
import { getMyWishlist } from "../../services/mypageService";

export default function MyWishlistPage() {
  const [wishlistRows, setWishlistRows] = useState([]);
  const [lodgings, setLodgings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const lodgingMap = useMemo(() => Object.fromEntries(lodgings.map((lodging) => [lodging.id, lodging])), [lodgings]);
  const instantCount = wishlistRows.filter((item) => {
    const lodging = lodgingMap[item.lodgingId];
    return lodging?.status === "ACTIVE" || lodging?.highlights?.some((highlight) => highlight.includes("즉시"));
  }).length;

  useEffect(() => {
    let cancelled = false;

    async function loadWishlist() {
      try {
        setIsLoading(true);
        const [nextWishlist, nextLodgings] = await Promise.all([getMyWishlist(), getLodgings()]);
        if (cancelled) return;
        setWishlistRows(nextWishlist);
        setLodgings(nextLodgings);
      } catch (error) {
        console.error("Failed to load wishlist.", error);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadWishlist();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <MyPageLayout>
      <section className="my-list-sheet wishlist-sheet wishlist-sheet-v2">
        {isLoading ? (
          <div className="my-empty-panel">
            <strong>찜 목록을 불러오는 중입니다.</strong>
            <p>찜한 숙소와 숙소 상세 정보를 함께 동기화하고 있습니다.</p>
          </div>
        ) : null}
        <div className="mypage-header-row">
          <div className="mypage-header-copy">
            <strong>찜 목록</strong>
            <p>찜한 숙소에서 바로 상세 페이지로 이동합니다.</p>
          </div>
          <span className="my-stat-pill">숙소 {wishlistRows.length}개</span>
        </div>
        <div className="wishlist-summary-strip">
          <div className="wishlist-summary-card">
            <span>찜한 숙소</span>
            <strong>{wishlistRows.length}곳</strong>
          </div>
          <div className="wishlist-summary-card is-mint">
            <span>즉시 확정 가능</span>
            <strong>{instantCount}곳</strong>
          </div>
          <div className="wishlist-summary-card is-soft">
            <span>이번 주 체크 포인트</span>
            <strong>가격 변동 확인</strong>
          </div>
        </div>
        <div className="wishlist-list booking-list-rows--flush">
          {wishlistRows.map((item) => (
            <article key={item.name} className="wishlist-row">
              <Link className="wishlist-media" to={`/lodgings/${item.lodgingId}`}>
                <img src={lodgingMap[item.lodgingId]?.image} alt={item.name} />
              </Link>
              <div className="wishlist-main">
                <div className="wishlist-copy">
                  <div className="payment-row-topline">
                    <span className="inline-chip">{item.status}</span>
                    <span className="wishlist-region">{lodgingMap[item.lodgingId]?.region} · {lodgingMap[item.lodgingId]?.district}</span>
                  </div>
                  <strong>{item.name}</strong>
                  <p>{lodgingMap[item.lodgingId]?.type} · {lodgingMap[item.lodgingId]?.room}</p>
                </div>
              </div>
              <div className="wishlist-side">
                <span className="wishlist-side-meta">1박 기준</span>
                <strong className="wishlist-side-price">{item.price ?? lodgingMap[item.lodgingId]?.price ?? "가격 확인"}</strong>
                <Link className="coupon-action-button" to={`/lodgings/${item.lodgingId}`}>
                  상세보기
                </Link>
              </div>
            </article>
          ))}
          {!isLoading && !wishlistRows.length ? (
            <div className="my-empty-panel">
              <strong>찜한 숙소가 없습니다.</strong>
              <p>마음에 드는 숙소를 찜하면 여기에 모아볼 수 있습니다.</p>
            </div>
          ) : null}
        </div>
      </section>

    </MyPageLayout>
  );
}
