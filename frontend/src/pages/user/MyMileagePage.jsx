import { useEffect, useState } from "react";
import MyPageLayout from "../../components/user/MyPageLayout";
import { getMileageSummary } from "../../features/mypage/mypageViewModels";
import { getMyMileage } from "../../services/mypageService";

export default function MyMileagePage() {
  const [filter, setFilter] = useState("all");
  const [mileageData, setMileageData] = useState({ summary: { balance: 0, earnedThisMonth: 0, usedThisMonth: 0 }, items: [] });
  const [isLoading, setIsLoading] = useState(true);
  const { earnedThisMonth, usedThisMonth, filteredRows } = getMileageSummary(mileageData.items, filter);

  useEffect(() => {
    let cancelled = false;

    async function loadMileage() {
      try {
        setIsLoading(true);
        const response = await getMyMileage();
        if (cancelled) return;
        setMileageData(response);
      } catch (error) {
        console.error("Failed to load mileage history.", error);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadMileage();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <MyPageLayout>
      <section className="my-list-sheet mileage-sheet mileage-sheet-v2">
        {isLoading ? (
          <div className="my-empty-panel">
            <strong>마일리지 내역을 불러오는 중입니다.</strong>
            <p>보유 포인트와 적립/사용 이력을 동기화하고 있습니다.</p>
          </div>
        ) : null}
        <div className="mypage-header-row">
          <div className="mypage-header-copy">
            <strong>마일리지</strong>
            <p>예약과 활동으로 적립한 TripZone 마일리지를 확인합니다.</p>
          </div>
        </div>
        <section className="mileage-hero-card">
          <div className="mileage-hero-main">
            <span>내 마일리지</span>
            <strong>{Number(mileageData.summary?.balance ?? 0).toLocaleString()}P</strong>
            <p>다음 예약 결제에서 바로 사용할 수 있는 보유 혜택</p>
          </div>
          <div className="mileage-hero-stats">
            <div>
              <span>이번 달 적립</span>
              <strong>+{earnedThisMonth.toLocaleString()}</strong>
            </div>
            <div>
              <span>이번 달 사용</span>
              <strong>-{usedThisMonth.toLocaleString()}</strong>
            </div>
          </div>
        </section>
        <div className="point-tab-row" role="tablist" aria-label="마일리지 필터">
          <button type="button" className={`point-tab${filter === "all" ? " is-active" : ""}`} onClick={() => setFilter("all")}>전체</button>
          <button type="button" className={`point-tab${filter === "earn" ? " is-active" : ""}`} onClick={() => setFilter("earn")}>적립</button>
          <button type="button" className={`point-tab${filter === "use" ? " is-active" : ""}`} onClick={() => setFilter("use")}>사용</button>
        </div>
        {filteredRows.length ? (
          <div className="payment-row-list mileage-row-list">
            {filteredRows.map((item) => (
            <article key={`${item.label}-${item.time}`} className="payment-row mileage-row">
              <div className="payment-row-main">
                <div className="payment-row-copy">
                  <div className="payment-row-topline">
                    <span className={`table-code${item.type === "사용" ? " code-refunded" : " code-available"}`}>
                      {item.type}
                    </span>
                    <span>{item.time}</span>
                  </div>
                <strong>{item.label}</strong>
                <p>{item.type === "사용" ? "예약 결제에 사용된 마일리지 내역입니다." : "예약과 활동으로 적립된 마일리지입니다."}</p>
              </div>
              </div>
              <div className="payment-row-side mileage-row-side">
                <strong className={`reward-amount ${item.amount.startsWith("-") ? "is-minus" : "is-plus"}`}>{item.amount}</strong>
              </div>
            </article>
            ))}
          </div>
        ) : !isLoading ? (
          <div className="my-empty-inline">포인트 내역이 없어요</div>
        ) : null}
      </section>
    </MyPageLayout>
  );
}
