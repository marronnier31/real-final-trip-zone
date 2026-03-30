import { Link, NavLink } from "react-router-dom";
import { myProfileSummary } from "../../data/mypageData";
import { readAuthSession } from "../../features/auth/authSession";

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
  const profileName = session?.name ?? myProfileSummary.name;

  return (
    <aside className="my-sidebar">
      <Link to="/my/membership" className="my-sidebar-profile">
        <div className="my-sidebar-mark" aria-hidden="true">
          <span className="my-sidebar-mark-wave" />
          <span className="my-sidebar-mark-sun" />
        </div>
        <div className="my-sidebar-copy">
          <strong>{profileName}</strong>
          <p>{myProfileSummary.grade} 회원</p>
        </div>
      </Link>
      <nav className="my-sidebar-nav" aria-label="마이페이지 메뉴">
        {ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => `my-sidebar-link${isActive ? " is-active" : ""}`}>
            <span>{item.label}</span>
            <span aria-hidden="true">›</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
