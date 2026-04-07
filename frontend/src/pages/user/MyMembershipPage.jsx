import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import MyPageLayout from "../../components/user/MyPageLayout";
import {
  membershipBenefitTiers,
} from "../../data/mypageData";
import { normalizeMembershipGrade } from "../../features/mypage/mypageViewModels";
import { getMyBookings, getMyMileage, getMyProfileSummary } from "../../services/mypageService";

const EMPTY_PROFILE_SUMMARY = {
  grade: "회원",
  gradeHint: "누적 마일리지 0",
};

function toMembershipTierTitle(grade = "") {
  const normalized = normalizeMembershipGrade(grade);
  if (normalized === "회원") return "Basic";
  return normalized.charAt(0) + normalized.slice(1).toLowerCase();
}

function getNextGrade(currentGrade) {
  const gradeOrder = ["Basic", "Silver", "Gold", "Black"];
  const index = gradeOrder.indexOf(currentGrade);
  return index >= 0 && index < gradeOrder.length - 1 ? gradeOrder[index + 1] : null;
}

export default function MyMembershipPage() {
  const [profileSummary, setProfileSummary] = useState(EMPTY_PROFILE_SUMMARY);
  const [membershipStats, setMembershipStats] = useState({
    bookingCount: 0,
    balance: 0,
  });

  useEffect(() => {
    let cancelled = false;

    async function loadProfileSummary() {
      try {
        const [summaryResponse, bookingsResponse, mileageResponse] = await Promise.all([
          getMyProfileSummary(),
          getMyBookings({ force: true }),
          getMyMileage(),
        ]);
        if (cancelled) return;
        setProfileSummary(summaryResponse);
        setMembershipStats({
          bookingCount: bookingsResponse.filter((item) => item.status !== "CANCELED").length,
          balance: Number(mileageResponse.summary?.balance ?? 0),
        });
      } catch (error) {
        console.error("Failed to load membership profile summary.", error);
      }
    }

    loadProfileSummary();

    return () => {
      cancelled = true;
    };
  }, []);

  const currentGrade = toMembershipTierTitle(profileSummary.grade);
  const nextGrade = getNextGrade(currentGrade);
  const membershipMilestones = [
    { label: "현재 등급", value: currentGrade },
    { label: "다음 등급", value: nextGrade ? `${nextGrade} 준비 단계` : "최상위 등급" },
    { label: "예약 이용 수", value: `${membershipStats.bookingCount}회` },
    { label: "누적 마일리지", value: `${membershipStats.balance.toLocaleString()}P` },
  ];

  return (
    <MyPageLayout>
      <section className="my-list-sheet membership-sheet">
        <header className="membership-hero">
          <div className="membership-hero-copy">
            <span className="membership-hero-eyebrow">Membership</span>
            <strong>{currentGrade} 등급 혜택</strong>
            <p>{profileSummary.gradeHint || "최근 이용 흐름을 기준으로 현재 회원 등급을 안내합니다."}</p>
          </div>
          <div className="membership-hero-badge">
            <span>현재 등급</span>
            <strong>{currentGrade}</strong>
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
            <article key={tier.grade} className={`membership-tier-card${tier.grade === currentGrade ? " is-current" : ""}`}>
              <div className="membership-tier-head">
                <div>
                  <span>{tier.grade === currentGrade ? "현재 적용 중" : "멤버십 안내"}</span>
                  <strong>{tier.grade}</strong>
                </div>
                {tier.grade === currentGrade ? <em>현재 등급</em> : null}
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
