import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { readAuthSession } from "../../features/auth/authSession";
import {
  getHeaderRoleLinks,
  getMembershipLabel,
  logoutCurrentSession,
} from "../../features/auth/authViewModels";
import { formatMembershipTierTitle } from "../../features/mypage/mypageViewModels";
import { get } from "../../lib/appClient";
import {
  getMyProfileSummary,
  invalidateMyPageCaches,
} from "../../services/mypageService";

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";
  const [session, setSession] = useState(() => readAuthSession());
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const [profileSummary, setProfileSummary] = useState(null);
  const [headerStats, setHeaderStats] = useState({
    availableCouponCount: 0,
    bookingCount: 0,
    mileageValue: "0P",
  });

  useEffect(() => {
    setSession(readAuthSession());
    setMenuOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (session?.role !== "ROLE_USER") {
      setProfileSummary(null);
      setHeaderStats({
        availableCouponCount: 0,
        bookingCount: 0,
        mileageValue: "0P",
      });
      return undefined;
    }

    let cancelled = false;

    async function loadHeaderData() {
      try {
        const [profile, couponResponse, bookingResponse] = await Promise.all([
          getMyProfileSummary(),
          get("/api/mypage/coupons?page=1&size=1"),
          get("/api/mypage/bookings?page=1&size=1"),
        ]);

        if (cancelled) return;

        setProfileSummary(profile ?? null);
        setHeaderStats({
          availableCouponCount: couponResponse?.totalCount ?? 0,
          bookingCount: bookingResponse?.totalCount ?? 0,
          mileageValue: `${Number(profile?.mileage ?? 0).toLocaleString()}P`,
        });
      } catch (error) {
        console.error("Failed to load header profile data.", error);
        if (!cancelled) {
          setProfileSummary(null);
          setHeaderStats({
            availableCouponCount: 0,
            bookingCount: 0,
            mileageValue: "0P",
          });
        }
      }
    }

    loadHeaderData();

    return () => {
      cancelled = true;
    };
  }, [session?.role]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const handlePointerDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [menuOpen]);

  const handleLogout = async () => {
    await logoutCurrentSession();
    invalidateMyPageCaches();
    setSession(readAuthSession());
    setMenuOpen(false);
    navigate("/");
  };

  const handleMembershipClick = (event) => {
    event.stopPropagation();
    setMenuOpen(false);
    if (session?.role === "ROLE_ADMIN") {
      navigate("/admin");
      return;
    }
    if (session?.role === "ROLE_HOST") {
      navigate("/seller");
      return;
    }
    navigate("/my/membership");
  };

  const membershipLabel =
    session?.role === "ROLE_USER"
      ? formatMembershipTierTitle(profileSummary?.grade)
      : getMembershipLabel(session);
  const profileLabel =
    session?.name ?? profileSummary?.userName ?? profileSummary?.name ?? "TripZone 회원";
  const profileMetaLabel =
    session?.role === "ROLE_ADMIN"
      ? "관리자 대시보드"
      : session?.role === "ROLE_HOST"
        ? "판매자 대시보드"
        : membershipLabel;
  const roleLinks = getHeaderRoleLinks(session);
  const availableCouponCount =
    session?.role === "ROLE_USER" ? headerStats.availableCouponCount : 0;
  const upcomingBookingCount =
    session?.role === "ROLE_USER" ? headerStats.bookingCount : 0;
  const mileageValue =
    session?.role === "ROLE_USER" ? headerStats.mileageValue : "0P";

  return (
    <header className={`header${isHome ? " is-home" : ""}`}>
      <div className="header-frame header-inner">
        <div className="header-brand-wrap">
          <Link className="brand" to="/">
            <span className="brand-mark" aria-hidden="true">
              <span className="brand-mark-wave" />
              <span className="brand-mark-sun" />
            </span>
            <span className="brand-copy">
              <span className="brand-main">TripZone</span>
              <span className="brand-sub">stay and travel</span>
            </span>
          </Link>
        </div>
        <div className="header-utility">
          {session ? (
            <div className="header-profile-menu" ref={menuRef}>
              <button
                type="button"
                className={`header-profile-chip${menuOpen ? " is-open" : ""}`}
                onClick={() => setMenuOpen((current) => !current)}
              >
                <span className="header-profile-badge" aria-hidden="true">
                  <span className="header-profile-badge-wave" />
                  <span className="header-profile-badge-sun" />
                </span>
                <span className="header-profile-copy">
                  <strong>{profileLabel}</strong>
                  <span
                    className="header-membership-link"
                    role="link"
                    tabIndex={0}
                    onClick={handleMembershipClick}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        handleMembershipClick(event);
                      }
                    }}
                  >
                    {profileMetaLabel}
                  </span>
                </span>
                <span className="header-profile-toggle" aria-hidden="true">
                  ☰
                </span>
              </button>
              {menuOpen ? (
                <div className="header-profile-dropdown">
                  {session?.role === "ROLE_USER" ? (
                    <div className="header-profile-summary">
                      <div className="header-profile-stats">
                        <Link className="header-profile-stat" to="/my/mileage">
                          <span>마일리지</span>
                          <strong>{mileageValue}</strong>
                        </Link>
                        <Link className="header-profile-stat" to="/my/coupons">
                          <span>쿠폰</span>
                          <strong>{availableCouponCount}장</strong>
                        </Link>
                        <Link className="header-profile-stat" to="/my/bookings">
                          <span>예약중</span>
                          <strong>{upcomingBookingCount}건</strong>
                        </Link>
                      </div>
                    </div>
                  ) : null}
                  <div className="header-profile-dropdown-links">
                    {roleLinks.map((item) => (
                      <Link
                        key={item.to}
                        className="header-dropdown-link"
                        to={item.to}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="header-dropdown-logout"
                    onClick={handleLogout}
                  >
                    로그아웃
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <>
              <Link className="utility-link" to="/login">
                로그인
              </Link>
              <Link className="header-signup" to="/signup">
                회원가입
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
