import { Link, useLocation } from "react-router-dom";

const ADMIN_MENU = [
  { label: "대시보드", to: "/admin", icon: "01" },
  { label: "회원 관리", to: "/admin/users", icon: "02" },
  { label: "판매자 관리", to: "/admin/sellers", icon: "03" },
  { label: "이벤트 · 쿠폰", to: "/admin/events", icon: "04" },
  { label: "문의 모니터링", to: "/admin/inquiries", icon: "05" },
  { label: "리뷰 운영", to: "/admin/reviews", icon: "06" },
];

const SELLER_MENU = [
  { label: "대시보드", to: "/seller", icon: "01" },
  { label: "숙소 관리", to: "/seller/lodgings", icon: "02" },
  { label: "객실 관리", to: "/seller/rooms", icon: "03" },
  { label: "이미지 관리", to: "/seller/assets", icon: "04" },
  { label: "예약 관리", to: "/seller/reservations", icon: "05" },
  { label: "문의 관리", to: "/seller/inquiries", icon: "06" },
];

export default function DashboardLayout({ role, children }) {
  const location = useLocation();
  const menu = role === "admin" ? ADMIN_MENU : SELLER_MENU;
  const roleLabel = role === "admin" ? "관리자센터" : "판매자센터";
  const roleClass = role === "admin" ? "is-admin" : "is-seller";

  return (
    <div className={`dash-layout ${roleClass}`}>
      <aside className="dash-sidebar">
        <div className="dash-sidebar-head">
          <span className="dash-sidebar-badge">{role === "admin" ? "A" : "S"}</span>
          <div className="dash-sidebar-info">
            <strong>{roleLabel}</strong>
            <span>TripZone</span>
          </div>
        </div>

        <div className="dash-sidebar-summary">
          <span>{role === "admin" ? "Operations" : "Workspace"}</span>
          <strong>{role === "admin" ? "승인, 모니터링, 제재 흐름" : "예약, 숙소, 문의 운영 흐름"}</strong>
        </div>

        <nav className="dash-sidebar-nav">
          {menu.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`dash-sidebar-link${isActive ? " is-active" : ""}`}
              >
                <span className="dash-sidebar-icon">{item.icon}</span>
                <span className="dash-sidebar-label">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="dash-sidebar-footer">
          <Link to="/" className="dash-sidebar-back">← 메인으로</Link>
        </div>
      </aside>

      <main className="dash-main">
        {children}
      </main>
    </div>
  );
}
