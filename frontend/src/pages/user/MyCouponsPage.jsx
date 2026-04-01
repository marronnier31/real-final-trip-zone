import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import MyPageLayout from "../../components/user/MyPageLayout";
import {
  getCouponAmount,
  getCouponSummary,
  getCouponToneClass,
  getCouponVisualClass,
} from "../../features/mypage/mypageViewModels";
import { deleteMyCoupon, fetchMyCoupons } from "../../services/mypageService";

export default function MyCouponsPage() {
  const [filter, setFilter] = useState("available");
  const [coupons, setCoupons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [deletingCouponId, setDeletingCouponId] = useState(null);
  const { expiringCount, filteredCoupons } = getCouponSummary(coupons, filter);

  useEffect(() => {
    let cancelled = false;

    async function loadCoupons() {
      try {
        setIsLoading(true);
        const rows = await fetchMyCoupons();
        if (cancelled) return;
        setCoupons(rows);
      } catch (error) {
        console.error("Failed to load my coupons.", error);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadCoupons();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleDeleteCoupon(item) {
    if (!item.userCouponId || deletingCouponId) {
      return;
    }

    try {
      setDeletingCouponId(item.userCouponId);
      setMessage("");
      const rows = await deleteMyCoupon(item.userCouponId);
      setCoupons(rows);
      setMessage("쿠폰을 정리했습니다.");
    } catch (error) {
      setMessage(error?.message ?? "쿠폰을 정리하지 못했습니다.");
    } finally {
      setDeletingCouponId(null);
    }
  }

  return (
    <MyPageLayout>
      <section className="my-list-sheet coupon-sheet coupon-sheet-v2">
        {isLoading ? (
          <div className="my-empty-panel">
            <strong>쿠폰함을 불러오는 중입니다.</strong>
            <p>보유 쿠폰과 만료 상태를 동기화하고 있습니다.</p>
          </div>
        ) : null}
        <div className="mypage-header-row">
          <div className="mypage-header-copy">
            <strong>쿠폰 {coupons.length}장</strong>
            <p>7일 이내 소멸예정 쿠폰 {expiringCount}장</p>
          </div>
          <span className="my-stat-pill is-soft">보유 쿠폰 관리</span>
        </div>
        <div className="mypage-guide-banner">
          <span>국내 숙소 쿠폰은 TripZone 예약에서 바로 사용할 수 있습니다.</span>
        </div>
        <div className="tab-filter-row" role="tablist" aria-label="쿠폰 필터">
          <button type="button" className={`tab-filter${filter === "available" ? " is-active" : ""}`} onClick={() => setFilter("available")}>사용 가능</button>
          <button type="button" className={`tab-filter${filter === "expiring" ? " is-active" : ""}`} onClick={() => setFilter("expiring")}>만료 예정</button>
          <button type="button" className={`tab-filter${filter === "used" ? " is-active" : ""}`} onClick={() => setFilter("used")}>사용 완료</button>
        </div>
        <div className="coupon-meta-row">
          <span>{filteredCoupons.length}개 쿠폰</span>
          <span>할인 혜택순</span>
        </div>
        {message ? <div className="my-inline-feedback">{message}</div> : null}
        {filteredCoupons.length ? (
          <div className="coupon-vault">
            {filteredCoupons.map((item) => (
            <article key={item.id} className={`coupon-vault-item ${getCouponToneClass(item)}`}>
              <div
                className={`coupon-vault-thumb ${getCouponVisualClass(item)}`}
                aria-hidden="true"
              >
                <span className="coupon-vault-stamp">TRIP</span>
              </div>
              <div className="coupon-vault-copy">
                  <div className="payment-row-topline">
                    <span className="coupon-vault-target">{item.target}</span>
                    <span className={`table-code${
                      item.status === "사용 가능"
                        ? " code-available"
                        : item.status === "사용 완료"
                          ? " code-closed"
                          : " code-pending"
                    }`}
                    >
                      {item.status}
                    </span>
                  </div>
                <strong>{item.name}</strong>
                <p>{item.issuedAt} 발급 · {item.expire}</p>
              </div>
              <div className="coupon-vault-side">
                <strong className="coupon-vault-amount">{getCouponAmount(item)}</strong>
                {item.status === "사용 가능" ? (
                  <Link className="coupon-action-button" to="/lodgings">사용하기</Link>
                ) : (
                  <span className="coupon-vault-hint">{item.status === "사용 완료" ? "사용 완료 쿠폰" : "곧 만료되는 쿠폰"}</span>
                )}
                <button
                  type="button"
                  className="coupon-action-button is-secondary"
                  onClick={() => handleDeleteCoupon(item)}
                  disabled={deletingCouponId === item.userCouponId}
                >
                  {deletingCouponId === item.userCouponId ? "정리 중" : "쿠폰 정리"}
                </button>
              </div>
            </article>
            ))}
          </div>
        ) : !isLoading ? (
          <div className="my-empty-inline">
            {filter === "available" ? "사용 가능한 보유 쿠폰이 없어요" : filter === "used" ? "사용 완료 쿠폰이 없어요" : "만료 예정 쿠폰이 없어요"}
          </div>
        ) : null}
      </section>
    </MyPageLayout>
  );
}
