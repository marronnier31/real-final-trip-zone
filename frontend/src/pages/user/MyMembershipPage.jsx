import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import MyPageLayout from "../../components/user/MyPageLayout";
import {
  membershipBenefitTiers,
  membershipMilestones,
  myProfileSummary,
} from "../../data/mypageData";
import { getMyProfileSummary } from "../../services/mypageService";

export default function MyMembershipPage() {
  const [profileSummary, setProfileSummary] = useState(myProfileSummary);

  useEffect(() => {
    let cancelled = false;

    async function loadProfileSummary() {
      try {
        const response = await getMyProfileSummary();
        if (cancelled) return;
        setProfileSummary(response);
      } catch (error) {
        console.error("Failed to load membership profile summary.", error);
      }
    }

    loadProfileSummary();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <MyPageLayout>
      <section className="my-list-sheet membership-sheet">
        <header className="membership-hero">
          <div className="membership-hero-copy">
            <span className="membership-hero-eyebrow">Membership</span>
            <strong>{profileSummary.grade} 등급 혜택</strong>
            <p>TripZone 회원 등급은 최근 예약 활동과 누적 이용 흐름에 따라 안내되며, 현재 페이지는 혜택 확인용으로만 제공합니다.</p>
          </div>
          <div className="membership-hero-badge">
            <span>현재 등급</span>
            <strong>{profileSummary.grade}</strong>
          </div>
        </header>

        <section className="membership-milestone-grid" aria-label="등급 요약">
          {membershipMilestones.map((item) => (
            <article key={item.label} className="membership-milestone-card">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </article>
          ))}
        </section>

        <section className="membership-tier-list" aria-label="등급별 혜택">
          {membershipBenefitTiers.map((tier) => (
            <article key={tier.grade} className={`membership-tier-card${tier.grade === profileSummary.grade ? " is-current" : ""}`}>
              <div className="membership-tier-head">
                <div>
                  <span>{tier.grade === profileSummary.grade ? "현재 적용 중" : "멤버십 안내"}</span>
                  <strong>{tier.grade}</strong>
                </div>
                {tier.grade === profileSummary.grade ? <em>현재 등급</em> : null}
              </div>
              <p>{tier.summary}</p>
              <ul className="membership-benefit-list">
                {tier.highlights.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </section>

        <section className="membership-footer">
          <div>
            <strong>혜택은 프로모션과 함께 계속 갱신됩니다.</strong>
            <p>쿠폰, 예약, 마일리지 화면에서 실제 적용 가능한 혜택을 이어서 확인할 수 있습니다.</p>
          </div>
          <div className="membership-footer-actions">
            <Link className="coupon-action-button" to="/events">프로모션 보기</Link>
            <Link className="ghost-action-button" to="/my/coupons">쿠폰 보기</Link>
          </div>
        </section>
      </section>
    </MyPageLayout>
  );
}
