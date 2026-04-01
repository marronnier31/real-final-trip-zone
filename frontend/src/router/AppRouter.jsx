import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import { readAuthSession } from "../features/auth/authSession";
import HomePage from "../pages/common/HomePage";
import DocsPage from "../pages/common/DocsPage";
import RolesPage from "../pages/common/RolesPage";
import LoginPage from "../pages/common/LoginPage";
import SignupPage from "../pages/common/SignupPage";
import AuthCallbackPage from "../pages/common/AuthCallbackPage";
import FindIdPage from "../pages/common/FindIdPage";
import FindPasswordPage from "../pages/common/FindPasswordPage";
import EventsPage from "../pages/common/EventsPage";
import LodgingListPage from "../pages/user/LodgingListPage";
import LodgingDetailPage from "../pages/user/LodgingDetailPage";
import BookingPage from "../pages/user/BookingPage";
import MyPageHomePage from "../pages/user/MyPageHomePage";
import MyProfilePage from "../pages/user/MyProfilePage";
import MyBookingsPage from "../pages/user/MyBookingsPage";
import MyBookingDetailPage from "../pages/user/MyBookingDetailPage";
import MyInquiriesPage from "../pages/user/MyInquiriesPage";
import MyWishlistPage from "../pages/user/MyWishlistPage";
import MyCouponsPage from "../pages/user/MyCouponsPage";
import MyMileagePage from "../pages/user/MyMileagePage";
import MyPaymentsPage from "../pages/user/MyPaymentsPage";
import MyMembershipPage from "../pages/user/MyMembershipPage";
import MySellerApplyPage from "../pages/user/MySellerApplyPage";
import MyInquiryCreatePage from "../pages/user/MyInquiryCreatePage";
import MyInquiryDetailPage from "../pages/user/MyInquiryDetailPage";
import MyInquiryEditPage from "../pages/user/MyInquiryEditPage";
import SellerDashboardPage from "../pages/seller/SellerDashboardPage";
import SellerLodgingsPage from "../pages/seller/SellerLodgingsPage";
import SellerRoomsPage from "../pages/seller/SellerRoomsPage";
import SellerAssetsPage from "../pages/seller/SellerAssetsPage";
import SellerReservationsPage from "../pages/seller/SellerReservationsPage";
import SellerInquiriesPage from "../pages/seller/SellerInquiriesPage";
import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import AdminUsersPage from "../pages/admin/AdminUsersPage";
import AdminSellersPage from "../pages/admin/AdminSellersPage";
import AdminEventsPage from "../pages/admin/AdminEventsPage";
import AdminInquiriesPage from "../pages/admin/AdminInquiriesPage";
import AdminReviewsPage from "../pages/admin/AdminReviewsPage";
import SubmissionHtmlRedirect from "./SubmissionHtmlRedirect";

function RequireRole({ allowedRoles, children }) {
  const session = readAuthSession();
  const roleNames = session?.roleNames ?? (session?.role ? [session.role] : []);

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length && !allowedRoles.some((role) => roleNames.includes(role))) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/submission-html/*" element={<SubmissionHtmlRedirect />} />
        <Route element={<AppShell />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/docs" element={<DocsPage />} />
          <Route path="/roles" element={<RolesPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/auth/kakao/callback" element={<AuthCallbackPage />} />
          <Route path="/auth/naver/callback" element={<AuthCallbackPage />} />
          <Route path="/find-id" element={<FindIdPage />} />
          <Route path="/find-password" element={<FindPasswordPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/lodgings" element={<LodgingListPage />} />
          <Route path="/lodgings/:lodgingId" element={<LodgingDetailPage />} />
          <Route path="/booking/:lodgingId" element={<BookingPage />} />
          <Route path="/my" element={<RequireRole allowedRoles={["ROLE_USER"]}><MyPageHomePage /></RequireRole>} />
          <Route path="/my/home" element={<RequireRole allowedRoles={["ROLE_USER"]}><MyPageHomePage /></RequireRole>} />
          <Route path="/my/profile" element={<RequireRole allowedRoles={["ROLE_USER"]}><MyProfilePage /></RequireRole>} />
          <Route path="/my/bookings" element={<RequireRole allowedRoles={["ROLE_USER"]}><MyBookingsPage /></RequireRole>} />
          <Route path="/my/bookings/:bookingId" element={<RequireRole allowedRoles={["ROLE_USER"]}><MyBookingDetailPage /></RequireRole>} />
          <Route path="/my/inquiries" element={<RequireRole allowedRoles={["ROLE_USER"]}><MyInquiriesPage /></RequireRole>} />
          <Route path="/my/inquiries/new" element={<RequireRole allowedRoles={["ROLE_USER"]}><MyInquiryCreatePage /></RequireRole>} />
          <Route path="/my/inquiries/:inquiryId" element={<RequireRole allowedRoles={["ROLE_USER"]}><MyInquiryDetailPage /></RequireRole>} />
          <Route path="/my/inquiries/:inquiryId/edit" element={<RequireRole allowedRoles={["ROLE_USER"]}><MyInquiryEditPage /></RequireRole>} />
          <Route path="/my/wishlist" element={<RequireRole allowedRoles={["ROLE_USER"]}><MyWishlistPage /></RequireRole>} />
          <Route path="/my/coupons" element={<RequireRole allowedRoles={["ROLE_USER"]}><MyCouponsPage /></RequireRole>} />
          <Route path="/my/mileage" element={<RequireRole allowedRoles={["ROLE_USER"]}><MyMileagePage /></RequireRole>} />
          <Route path="/my/payments" element={<RequireRole allowedRoles={["ROLE_USER"]}><MyPaymentsPage /></RequireRole>} />
          <Route path="/my/membership" element={<RequireRole allowedRoles={["ROLE_USER"]}><MyMembershipPage /></RequireRole>} />
          <Route path="/my/seller-apply" element={<RequireRole allowedRoles={["ROLE_USER"]}><MySellerApplyPage /></RequireRole>} />
          <Route path="/seller" element={<RequireRole allowedRoles={["ROLE_HOST"]}><SellerDashboardPage /></RequireRole>} />
          <Route path="/seller/apply" element={<Navigate to="/my/seller-apply" replace />} />
          <Route path="/seller/lodgings" element={<RequireRole allowedRoles={["ROLE_HOST"]}><SellerLodgingsPage /></RequireRole>} />
          <Route path="/seller/rooms" element={<RequireRole allowedRoles={["ROLE_HOST"]}><SellerRoomsPage /></RequireRole>} />
          <Route path="/seller/assets" element={<RequireRole allowedRoles={["ROLE_HOST"]}><SellerAssetsPage /></RequireRole>} />
          <Route path="/seller/reservations" element={<RequireRole allowedRoles={["ROLE_HOST"]}><SellerReservationsPage /></RequireRole>} />
          <Route path="/seller/inquiries" element={<RequireRole allowedRoles={["ROLE_HOST"]}><SellerInquiriesPage /></RequireRole>} />
          <Route path="/admin" element={<RequireRole allowedRoles={["ROLE_ADMIN"]}><AdminDashboardPage /></RequireRole>} />
          <Route path="/admin/users" element={<RequireRole allowedRoles={["ROLE_ADMIN"]}><AdminUsersPage /></RequireRole>} />
          <Route path="/admin/sellers" element={<RequireRole allowedRoles={["ROLE_ADMIN"]}><AdminSellersPage /></RequireRole>} />
          <Route path="/admin/events" element={<RequireRole allowedRoles={["ROLE_ADMIN"]}><AdminEventsPage /></RequireRole>} />
          <Route path="/admin/inquiries" element={<RequireRole allowedRoles={["ROLE_ADMIN"]}><AdminInquiriesPage /></RequireRole>} />
          <Route path="/admin/reviews" element={<RequireRole allowedRoles={["ROLE_ADMIN"]}><AdminReviewsPage /></RequireRole>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
