import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { readAuthSession } from "../../features/auth/authSession";
import { getMyProfileSummary } from "../../services/mypageService";
import { formatMembershipTierTitle } from "../../features/mypage/mypageViewModels";

const ITEMS = [
  { to: "/my/bookings", label: "예약 내역" },
  { to: "/my/wishlist", label: "찜 목록" },
  { to: "/my/mileage", label: "마일리지" },
  { to: "/my/coupons", label: "쿠폰" },
  { to: "/my/profile", label: "내 정보 관리" },
  { to: "/my/seller-apply", label: "판매자 신청" },
  { to: "/my/payments", label: "결제 내역" },
  { to: "/my/inquiries", label: "문의센터" },
];

export default function MyPageSidebar() {
  const session = readAuthSession();
  const [profileSummary, setProfileSummary] = useState(null);

  console.log("MyPageSidebar rendered");
  useEffect(() => {
    console.log("MyPageSidebar useEffect start", session?.role);

    if (session?.role !== "ROLE_USER") {
      setProfileSummary(null);
      return undefined;
    }

    let cancelled = false;

    async function loadProfileSummary() {
      try {
        const response = await getMyProfileSummary();
        console.log("profileSummary response:", response);
        if (cancelled) return;
        setProfileSummary(response ?? null);
      } catch {
        if (!cancelled) {
          setProfileSummary(null);
        }
      }
    }

    loadProfileSummary();

    return () => {
      cancelled = true;
    };
  }, [session?.role]);

  const profileName =
    profileSummary?.userName ?? session?.name ?? "TripZone 회원";
  const gradeLabel =
    session?.role === "ROLE_USER"
      ? formatMembershipTierTitle(profileSummary?.grade)
      : "사용자";

  return (
    <aside className="my-sidebar">
      <Link to="/my/membership" className="my-sidebar-profile">
        <div className="my-sidebar-mark" aria-hidden="true">
          <span className="my-sidebar-mark-wave" />
          <span className="my-sidebar-mark-sun" />
        </div>
        <div className="my-sidebar-copy">
          <strong>{profileName}</strong>
          <p>{gradeLabel}</p>
        </div>
      </Link>
      <nav className="my-sidebar-nav" aria-label="마이페이지 메뉴">
        {ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `my-sidebar-link${isActive ? " is-active" : ""}`
            }
          >
            <span>{item.label}</span>
            <span aria-hidden="true">›</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
