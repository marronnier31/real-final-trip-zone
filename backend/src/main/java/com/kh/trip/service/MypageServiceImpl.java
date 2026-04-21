package com.kh.trip.service;

import java.text.NumberFormat;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.kh.trip.domain.Booking;
import com.kh.trip.domain.Comment;
import com.kh.trip.domain.Inquiry;
import com.kh.trip.domain.Lodging;
import com.kh.trip.domain.MileageHistory;
import com.kh.trip.domain.Payment;
import com.kh.trip.domain.Room;
import com.kh.trip.domain.User;
import com.kh.trip.domain.UserAuthProvider;
import com.kh.trip.domain.UserCoupon;
import com.kh.trip.domain.WishList;
import com.kh.trip.domain.enums.BookingStatus;
import com.kh.trip.domain.enums.CouponStatus;
import com.kh.trip.domain.enums.InquiryStatus;
import com.kh.trip.domain.enums.InquiryType;
import com.kh.trip.domain.enums.MileageChangeType;
import com.kh.trip.domain.enums.PaymentPayMethod;
import com.kh.trip.domain.enums.PaymentStatus;
import com.kh.trip.domain.enums.RoomStatus;
import com.kh.trip.dto.MypageDTO;
import com.kh.trip.dto.PageRequestDTO;
import com.kh.trip.dto.PageResponseDTO;
import com.kh.trip.repository.BookingRepository;
import com.kh.trip.repository.CommentRepository;
import com.kh.trip.repository.InquiryRepository;
import com.kh.trip.repository.MileageHistoryRepository;
import com.kh.trip.repository.MypageBookingRepository;
import com.kh.trip.repository.PaymentRepository;
import com.kh.trip.repository.RoomRepository;
import com.kh.trip.repository.UserAuthProviderRepository;
import com.kh.trip.repository.UserCouponRepository;
import com.kh.trip.repository.UserRepository;
import com.kh.trip.repository.WishListRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MypageServiceImpl implements MypageService {

	private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy.MM.dd");
	private static final DateTimeFormatter DATE_TIME_FORMAT = DateTimeFormatter.ofPattern("yyyy.MM.dd HH:mm");
	private static final DateTimeFormatter SHORT_DATE_FORMAT = DateTimeFormatter.ofPattern("MM.dd");
	private static final NumberFormat NUMBER_FORMAT = NumberFormat.getNumberInstance(Locale.KOREA);

	private final UserRepository userRepository;
	private final UserAuthProviderRepository userAuthProviderRepository;
	private final BookingRepository bookingRepository;
	private final CommentRepository commentRepository;
	private final MypageBookingRepository mypageBookingRepository;
	private final UserCouponRepository userCouponRepository;
	private final MileageHistoryRepository mileageHistoryRepository;
	private final PaymentRepository paymentRepository;
	private final RoomRepository roomRepository;
	private final WishListRepository wishListRepository;
	private final InquiryRepository inquiryRepository;

	@Override
	public MypageDTO.HomeResponse getHome(Long userNo) {
		User user = getUser(userNo);
		List<Booking> bookings = bookingRepository.findMypageBookings(userNo);
		List<UserCoupon> coupons = userCouponRepository.findMypageCoupons(userNo);
		List<Payment> payments = paymentRepository.findMypagePayments(userNo);
		List<WishList> wishlists = loadWishlistRows(userNo);

		return MypageDTO.HomeResponse.builder()
				.profileSummary(toProfileSummary(user, userAuthProviderRepository.findByUserNo(userNo)))
				.overview(MypageDTO.Overview.builder()
						.upcomingBookingCount(bookings.stream().filter(this::isUpcomingBooking).count())
						.wishlistCount(wishlists.size())
						.availableCouponCount(coupons.stream()
								.filter(coupon -> resolveCouponStatus(coupon) == CouponStatus.ACTIVE).count())
						.paidCount(payments.stream().filter(payment -> payment.getPaymentStatus() == PaymentStatus.PAID)
								.count())
						.build())
				.menus(defaultMenus()).build();
	}

	@Override
	public MypageDTO.ProfileResponse getProfile(Long userNo) {
		User user = getUser(userNo);
		List<UserAuthProvider> authProviders = userAuthProviderRepository.findByUserNo(userNo);

		return MypageDTO.ProfileResponse.builder().summary(toProfileSummary(user, authProviders))
				.details(List.of(profileDetail("이메일", user.getEmail()), profileDetail("전화번호", user.getPhone()),
						profileDetail("로그인 방식", resolveLoginMethod(authProviders)),
						profileDetail("회원 등급",
								user.getMemberGrade() != null ? user.getMemberGrade().getGradeName().name() : null),
						profileDetail("비밀번호", "********"),
						profileDetail("마케팅 수신", null), profileDetail("최근 로그인", resolveLastLoginAt(authProviders))))
				.build();
	}

	@Override
	public MypageDTO.BookingResponse getBookings(Long userNo) {
		List<Booking> bookings = bookingRepository.findMypageBookings(userNo);
		List<Payment> payments = paymentRepository.findMypagePayments(userNo);

		return MypageDTO.BookingResponse.builder().summary(MypageDTO.BookingSummary.builder()
				.totalCount(bookings.size()).upcomingCount(bookings.stream().filter(this::isUpcomingBooking).count())
				.completedCount(
						bookings.stream().filter(booking -> booking.getStatus() == BookingStatus.COMPLETED).count())
				.canceledCount(
						bookings.stream().filter(booking -> booking.getStatus() == BookingStatus.CANCELED).count())
				.build()).items(bookings.stream().map(booking -> toBookingItem(booking, payments)).toList()).build();
	}

	@Override
	public MypageDTO.CouponResponse getCoupons(Long userNo) {
		List<UserCoupon> coupons = userCouponRepository.findMypageCoupons(userNo);

		return MypageDTO.CouponResponse.builder().summary(MypageDTO.CouponSummary.builder()
				.availableCount(
						coupons.stream().filter(coupon -> resolveCouponStatus(coupon) == CouponStatus.ACTIVE).count())
				.expiringSoonCount(coupons.stream().filter(this::isExpiringSoonCoupon).count())
				.usedCount(coupons.stream().filter(coupon -> resolveCouponStatus(coupon) == CouponStatus.USED).count())
				.build()).items(coupons.stream().map(this::toCouponItem).toList()).build();
	}

	@Override
	public MypageDTO.MileageResponse getMileage(Long userNo) {
		User user = getUser(userNo);
		List<MileageHistory> rows = mileageHistoryRepository
				.findByUser_UserNoOrderByRegDateDesc(userNo, Pageable.unpaged()).getContent();
		YearMonth currentMonth = YearMonth.now();

		return MypageDTO.MileageResponse.builder().summary(MypageDTO.MileageSummary.builder()
				.balance(defaultLong(user.getMileage()))
				.earnedThisMonth(rows.stream().filter(history -> isSameMonth(history.getRegDate(), currentMonth))
						.filter(history -> history.getChangeType() == MileageChangeType.EARN)
						.mapToLong(MileageHistory::getChangeAmount).sum())
				.usedThisMonth(rows.stream().filter(history -> isSameMonth(history.getRegDate(), currentMonth))
						.filter(history -> history.getChangeType() == MileageChangeType.USE)
						.mapToLong(MileageHistory::getChangeAmount).sum())
				.build()).items(rows.stream().map(this::toMileageItem).toList()).build();
	}

	@Override
	public PageResponseDTO<MypageDTO.MileageItem> getMileageHistory(Long userNo, PageRequestDTO pageRequestDTO) {
		int page = pageRequestDTO.getPage() <= 0 ? 1 : pageRequestDTO.getPage();
		int size = pageRequestDTO.getSize() <= 0 ? 10 : pageRequestDTO.getSize();

		Pageable pageable = org.springframework.data.domain.PageRequest.of(page - 1, size);

		org.springframework.data.domain.Page<MileageHistory> result = mileageHistoryRepository
				.findByUser_UserNoOrderByRegDateDesc(userNo, pageable);

		List<MypageDTO.MileageItem> dtoList = result.stream().map(this::toMileageItem).toList();

		return PageResponseDTO.<MypageDTO.MileageItem>withAll().dtoList(dtoList).pageRequestDTO(pageRequestDTO)
				.totalCount(result.getTotalElements()).build();
	}

	@Override
	public MypageDTO.PaymentResponse getPayments(Long userNo) {
		List<MypageDTO.PaymentItem> items = paymentRepository.findMypagePayments(userNo).stream()
				.map(this::toPaymentItem).toList();

		return MypageDTO.PaymentResponse.builder()
				.summary(MypageDTO.PaymentSummary.builder().paymentCount(items.size())
						.paidAmountTotal(items.stream().filter(item -> "PAID".equals(item.getStatus()))
								.mapToLong(MypageDTO.PaymentItem::getPaymentAmount).sum())
						.refundAmountTotal(items.stream().mapToLong(MypageDTO.PaymentItem::getRefundAmount).sum())
						.paidCount(items.stream().filter(item -> "PAID".equals(item.getStatus())).count())
						.refundedCount(items.stream().filter(item -> "REFUNDED".equals(item.getStatus())).count())
						.recentPaidAmount(items.stream().filter(item -> "PAID".equals(item.getStatus()))
								.map(MypageDTO.PaymentItem::getAmount).findFirst().orElse("-"))
						.recentRefundedAmount(items.stream().filter(item -> "REFUNDED".equals(item.getStatus()))
								.map(MypageDTO.PaymentItem::getAmount).findFirst().orElse("-"))
						.build())
				.items(items).build();
	}

	@Override
	public MypageDTO.WishlistResponse getWishlist(Long userNo) {
		return MypageDTO.WishlistResponse.builder()
				.items(loadWishlistRows(userNo).stream().map(this::toWishlistItem).toList()).build();
	}

	@Override
	public MypageDTO.InquiryResponse getInquiries(Long userNo) {
		List<MypageDTO.InquiryItem> items = inquiryRepository.findMypageInquiries(userNo).stream()
				.map(this::toInquiryItem).toList();

		return MypageDTO.InquiryResponse.builder()
				.summary(MypageDTO.InquirySummary.builder()
						.openCount(items.stream().filter(item -> "OPEN".equals(item.getStatus())).count())
						.answeredCount(items.stream().filter(item -> "ANSWERED".equals(item.getStatus())).count())
						.closedCount(items.stream().filter(item -> "CLOSED".equals(item.getStatus())).count()).build())
				.items(items).build();
	}

	@Override
	public MypageDTO.InquiryDetailResponse getInquiryDetail(Long userNo, Long inquiryNo) {
		Inquiry inquiry = inquiryRepository.findById(inquiryNo)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "문의 정보를 찾을 수 없습니다."));

		if (!inquiry.getUser().getUserNo().equals(userNo)) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "본인 문의만 조회할 수 있습니다.");
		}

		List<Comment> comments = commentRepository.findByInquiry_InquiryNoOrderByRegDateAsc(inquiryNo);

		return MypageDTO.InquiryDetailResponse.builder()
				.id(inquiry.getInquiryNo())
				.title(inquiry.getTitle())
				.type(toInquiryType(inquiry.getInquiryType()))
				.status(toInquiryStatus(inquiry.getStatus()))
				.actor("회원")
				.lodging(resolveInquiryLodging(inquiry))
				.bookingNo(resolveInquiryBookingNo(inquiry))
				.updatedAt(formatDateTime(inquiry.getUpdDate() != null ? inquiry.getUpdDate() : inquiry.getRegDate()))
				.body(inquiry.getContent())
				.messages(buildInquiryMessages(inquiry, comments))
				.build();
	}

	private User getUser(Long userNo) {
		return userRepository.findById(userNo)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다."));
	}

	private void validateBookingRequest(MypageDTO.BookingCreateRequest request, Room room) {
		if (request.getCheckInDate() == null || request.getCheckOutDate() == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "체크인/체크아웃 날짜는 필수입니다.");
		}
		if (!request.getCheckOutDate().isAfter(request.getCheckInDate())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "체크아웃 날짜는 체크인 날짜보다 이후여야 합니다.");
		}
		if (request.getCheckInDate().isBefore(LocalDateTime.now())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "과거 날짜로는 예약할 수 없습니다.");
		}
		if (request.getGuestCount() == null || request.getGuestCount() <= 0) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "투숙 인원은 1명 이상이어야 합니다.");
		}
		if (room.getStatus() != RoomStatus.AVAILABLE) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "예약이 불가한 객실입니다.");
		}
		if (request.getGuestCount() > room.getMaxGuestCount()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "객실 최대 인원을 초과했습니다.");
		}
	}

	private void validateRoomAvailability(MypageDTO.BookingCreateRequest request, Room room) {
		List<BookingStatus> activeStatuses = List.of(BookingStatus.PENDING, BookingStatus.CONFIRMED);
		long overlappingCount = mypageBookingRepository.countOverlappingBookings(room.getRoomNo(),
				request.getCheckInDate(), request.getCheckOutDate(), activeStatuses);

		if (overlappingCount >= room.getRoomCount()) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "선택한 날짜에는 예약 가능한 객실이 없습니다.");
		}
	}

	private List<MypageDTO.MenuItem> defaultMenus() {
		return List.of(menu("내 정보 관리", "등급과 회원 정보를 확인하고 수정 흐름을 준비합니다.", "/my/profile"),
				menu("쿠폰 리스트", "보유 쿠폰을 최신순으로 확인합니다.", "/my/coupons"),
				menu("예약 내역", "최신 예약 상태와 후기 작성 흐름을 확인합니다.", "/my/bookings"),
				menu("마일리지 내역", "보유 마일리지와 적립/사용 내역을 확인합니다.", "/my/mileage"),
				menu("위시리스트", "찜한 숙소에서 상세 페이지로 바로 이동합니다.", "/my/wishlist"),
				menu("결제 내역", "숙소 결제와 환불 내역을 최신순으로 봅니다.", "/my/payments"),
				menu("문의센터", "문의 등록, 상세, 수정, 삭제 흐름을 확인합니다.", "/my/inquiries"));
	}

	private MypageDTO.MenuItem menu(String title, String subtitle, String href) {
		return MypageDTO.MenuItem.builder().title(title).subtitle(subtitle).href(href).build();
	}

	private MypageDTO.ProfileSummary toProfileSummary(User user, List<UserAuthProvider> authProviders) {
		return MypageDTO.ProfileSummary.builder().name(user.getUserName())
				.grade(user.getMemberGrade() != null ? user.getMemberGrade().getGradeName().name() : null)
				.gradeHint("누적 마일리지 " + NUMBER_FORMAT.format(defaultLong(user.getMileage())))
				.status("1".equals(user.getEnabled()) ? "활성 회원" : "비활성 회원")
				.joinedAt(user.getRegDate() != null ? DATE_FORMAT.format(user.getRegDate()) + " 가입" : null).build();
	}

	private MypageDTO.ProfileDetail profileDetail(String label, String value) {
		return MypageDTO.ProfileDetail.builder().label(label).value(value).build();
	}

	private MypageDTO.BookingItem toBookingItem(Booking booking, List<Payment> payments) {
		Lodging lodging = booking.getRoom().getLodging();
		String bookingCode = "B-" + booking.getBookingNo();
		boolean hasPayment = payments.stream()
				.anyMatch(payment -> payment.getBooking().getBookingNo().equals(booking.getBookingNo()));

		return MypageDTO.BookingItem.builder()
				.bookingNo(booking.getBookingNo())
				.bookingId(bookingCode)
				.lodgingId(lodging.getLodgingNo())
				.lodgingName(lodging.getLodgingName())
				.name(lodging.getLodgingName())
				.roomId(booking.getRoom().getRoomNo())
				.roomName(booking.getRoom().getRoomName())
				.checkInDate(formatLocalDate(booking.getCheckInDate()))
				.checkOutDate(formatLocalDate(booking.getCheckOutDate()))
				.stay(formatStay(booking.getCheckInDate(), booking.getCheckOutDate()))
				.guestCount(defaultLong(booking.getGuestCount())).status(booking.getStatus().name())
				.bookingStatus(booking.getStatus().name()).bookingStatusLabel(toBookingStatusLabel(booking.getStatus()))
				.bookingAmount(defaultLong(booking.getTotalPrice()))
				.price(formatWon(defaultLong(booking.getTotalPrice())))
				.canCancel(
						booking.getStatus() == BookingStatus.PENDING || booking.getStatus() == BookingStatus.CONFIRMED)
				.canReview(booking.getStatus() == BookingStatus.COMPLETED).canViewPayment(hasPayment).build();
	}

	private MypageDTO.CouponItem toCouponItem(UserCoupon coupon) {
		CouponStatus status = resolveCouponStatus(coupon);
		return MypageDTO.CouponItem.builder().id(coupon.getUserCouponNo()).userCouponId(coupon.getUserCouponNo())
				.couponName(coupon.getCoupon().getCouponName()).name(coupon.getCoupon().getCouponName())
				.couponType(coupon.getCoupon().getDiscountType().name())
				.discountValue(defaultLong(coupon.getCoupon().getDiscountValue())).discountLabel(formatDiscount(coupon))
				.status(toCouponStatusLabel(status)).statusLabel(toCouponStatusLabel(status))
				.expire(formatCouponExpire(coupon, status))
				.expiredAt(coupon.getCoupon().getEndDate() != null ? DATE_FORMAT.format(coupon.getCoupon().getEndDate())
						: null)
				.target(null).appliesTo(null).isUsable(status == CouponStatus.ACTIVE)
				.issuedAt(coupon.getIssuedAt() != null ? DATE_FORMAT.format(coupon.getIssuedAt()) : null).build();
	}

	private MypageDTO.MileageItem toMileageItem(MileageHistory history) {
		boolean minus = history.getChangeType() == MileageChangeType.USE
				|| history.getChangeType() == MileageChangeType.EXPIRE;
		long amount = defaultLong(history.getChangeAmount());
		return MypageDTO.MileageItem.builder().label(history.getReason())
				.amount((minus ? "-" : "+") + NUMBER_FORMAT.format(amount))
				.time(history.getRegDate() != null ? DATE_FORMAT.format(history.getRegDate()) : null)
				.type(toMileageTypeLabel(history.getChangeType())).build();
	}

	private MypageDTO.PaymentItem toPaymentItem(Payment payment) {
		String status = resolvePaymentStatus(payment);
		return MypageDTO.PaymentItem.builder().paymentId(payment.getPaymentId())
				.bookingId("B-" + payment.getBooking().getBookingNo())
				.bookingNo("B-" + payment.getBooking().getBookingNo())
				.lodgingName(payment.getBooking().getRoom().getLodging().getLodgingName())
				.roomName(payment.getBooking().getRoom().getRoomName())
				.paymentAmount(defaultLong(payment.getPaymentAmount()))
				.refundAmount(defaultLong(payment.getRefundAmount()))
				.amount("REFUNDED".equals(status)
						? "-" + NUMBER_FORMAT.format(defaultLong(payment.getRefundAmount())) + "원"
						: formatWon(defaultLong(payment.getPaymentAmount())))
				.status(status).paymentStatus(status).paymentStatusLabel(toPaymentStatusLabel(status))
				.paymentMethod(payment.getPayMethod() != null ? payment.getPayMethod().name() : null)
				.paymentMethodLabel(toPaymentMethodLabel(payment.getPayMethod())).paidAt(resolvePaymentDate(payment))
				.detail(buildPaymentDetail(payment, status)).build();
	}

	private MypageDTO.WishlistItem toWishlistItem(WishList wishList) {
		Lodging lodging = wishList.getLodging();
		return MypageDTO.WishlistItem.builder().lodgingId(lodging.getLodgingNo()).name(lodging.getLodgingName())
				.meta(buildWishlistMeta(lodging)).price(null).status("찜한 숙소").build();
	}

	private MypageDTO.InquiryItem toInquiryItem(Inquiry inquiry) {
		return MypageDTO.InquiryItem.builder()
				.id(inquiry.getInquiryNo())
				.title(inquiry.getTitle())
				.type(toInquiryType(inquiry.getInquiryType()))
				.status(toInquiryStatus(inquiry.getStatus()))
				.actor("회원")
				.lodging(resolveInquiryLodging(inquiry))
				.bookingNo(resolveInquiryBookingNo(inquiry))
				.updatedAt(inquiry.getUpdDate() != null ? DATE_TIME_FORMAT.format(inquiry.getUpdDate()) : null)
				.preview(inquiry.getContent()).build();
	}

	private String resolveInquiryLodging(Inquiry inquiry) {
		if (inquiry.getRelatedLodgingName() == null || inquiry.getRelatedLodgingName().isBlank()) {
			return "운영 문의";
		}
		return inquiry.getRelatedLodgingName();
	}

	private String resolveInquiryBookingNo(Inquiry inquiry) {
		if (inquiry.getRelatedBookingNo() == null || inquiry.getRelatedBookingNo().isBlank()) {
			return "-";
		}
		return inquiry.getRelatedBookingNo();
	}

	private List<MypageDTO.InquiryMessageItem> buildInquiryMessages(Inquiry inquiry, List<Comment> comments) {
		List<MypageDTO.InquiryMessageItem> messages = new java.util.ArrayList<>();
		messages.add(MypageDTO.InquiryMessageItem.builder()
				.id("inquiry-" + inquiry.getInquiryNo())
				.sender("회원")
				.time(formatDateTime(inquiry.getRegDate()))
				.body(inquiry.getContent())
				.build());

		messages.addAll(comments.stream()
				.map(comment -> MypageDTO.InquiryMessageItem.builder()
						.id("comment-" + comment.getCommentNo())
						.sender("운영팀")
						.time(formatDateTime(comment.getRegDate()))
						.body(comment.getContent())
						.build())
				.toList());

		return messages;
	}

	private List<WishList> loadWishlistRows(Long userNo) {
		return wishListRepository.findByUserUserNo(userNo, Pageable.unpaged()).getContent().stream()
				.sorted(Comparator.comparing(WishList::getRegDate, Comparator.nullsLast(Comparator.reverseOrder())))
				.toList();
	}

	private boolean isUpcomingBooking(Booking booking) {
		return booking.getStatus() == BookingStatus.PENDING || booking.getStatus() == BookingStatus.CONFIRMED;
	}

	private boolean isSameMonth(LocalDateTime value, YearMonth targetMonth) {
		return value != null && YearMonth.from(value).equals(targetMonth);
	}

	private CouponStatus resolveCouponStatus(UserCoupon coupon) {
		if (coupon.getUsedAt() != null || coupon.getStatus() == CouponStatus.USED) {
			return CouponStatus.USED;
		}
		if (coupon.getCoupon() == null) {
			return coupon.getStatus();
		}
		LocalDateTime now = LocalDateTime.now();
		if (coupon.getCoupon().getEndDate() != null && coupon.getCoupon().getEndDate().isBefore(now)) {
			return CouponStatus.EXPIRED;
		}
		if (coupon.getCoupon().getStatus() == CouponStatus.INACTIVE) {
			return CouponStatus.INACTIVE;
		}
		return CouponStatus.ACTIVE;
	}

	private boolean isExpiringSoonCoupon(UserCoupon coupon) {
		if (resolveCouponStatus(coupon) != CouponStatus.ACTIVE || coupon.getCoupon().getEndDate() == null) {
			return false;
		}
		LocalDateTime now = LocalDateTime.now();
		return !coupon.getCoupon().getEndDate().isBefore(now)
				&& !coupon.getCoupon().getEndDate().isAfter(now.plusDays(7));
	}

	private String resolveLoginMethod(List<UserAuthProvider> authProviders) {
		if (authProviders.isEmpty()) {
			return null;
		}
		return authProviders.stream().map(UserAuthProvider::getProviderCode).distinct().map(this::toProviderLabel)
				.reduce((left, right) -> left + ", " + right).orElse(null);
	}

	private String resolveLastLoginAt(List<UserAuthProvider> authProviders) {
		return authProviders.stream().map(UserAuthProvider::getLastLoginAt).filter(java.util.Objects::nonNull)
				.max(Comparator.naturalOrder()).map(DATE_TIME_FORMAT::format).orElse(null);
	}

	private String formatLocalDate(LocalDateTime value) {
		return value != null ? value.toLocalDate().toString() : null;
	}

	private String formatStay(LocalDateTime checkIn, LocalDateTime checkOut) {
		if (checkIn == null || checkOut == null) {
			return null;
		}
		return SHORT_DATE_FORMAT.format(checkIn) + " - " + SHORT_DATE_FORMAT.format(checkOut);
	}

	private String formatWon(long amount) {
		return NUMBER_FORMAT.format(amount) + "원";
	}

	private String formatDiscount(UserCoupon coupon) {
		if ("PERCENT".equals(coupon.getCoupon().getDiscountType().name())) {
			return coupon.getCoupon().getDiscountValue() + "%";
		}
		return formatWon(defaultLong(coupon.getCoupon().getDiscountValue()));
	}

	private String formatCouponExpire(UserCoupon coupon, CouponStatus status) {
		if (status == CouponStatus.USED) {
			return "사용 완료";
		}
		if (coupon.getCoupon().getEndDate() == null) {
			return null;
		}
		return coupon.getCoupon().getEndDate().format(DateTimeFormatter.ofPattern("MM.dd")) + " 만료";
	}

	private String buildWishlistMeta(Lodging lodging) {
		if (lodging.getRegion() == null && lodging.getAddress() == null) {
			return null;
		}
		if (lodging.getRegion() == null) {
			return lodging.getAddress();
		}
		if (lodging.getAddress() == null) {
			return lodging.getRegion();
		}
		return lodging.getRegion() + " · " + lodging.getAddress();
	}

	private String resolvePaymentStatus(Payment payment) {
		if (payment.getPaymentStatus() == PaymentStatus.REFUNDED || defaultLong(payment.getRefundAmount()) > 0) {
			return "REFUNDED";
		}
		return payment.getPaymentStatus().name();
	}

	private String toBookingStatusLabel(BookingStatus status) {
		return switch (status) {
		case PENDING -> "대기";
		case CONFIRMED -> "확정";
		case CANCELED -> "예약 취소";
		case COMPLETED -> "숙박 완료";
		};
	}

	private String toCouponStatusLabel(CouponStatus status) {
		return switch (status) {
		case ACTIVE -> "사용 가능";
		case USED -> "사용 완료";
		case EXPIRED -> "만료 예정";
		case INACTIVE -> "사용 불가";
		case DELETE -> "삭제";
		};
	}

	private String toMileageTypeLabel(MileageChangeType type) {
		return switch (type) {
		case EARN -> "적립";
		case USE -> "사용";
		case CANCEL_USE -> "사용 복구";
		case EXPIRE -> "만료";
		case ADJUST -> "조정";
		};
	}

	private String toPaymentMethodLabel(PaymentPayMethod method) {
		if (method == null) {
			return null;
		}
		return switch (method) {
		case CARD -> "신용/체크카드";
		case BANK_TRANSFER -> "계좌이체";
		case VIRTUAL_ACCOUNT -> "가상계좌";
		case MOBILE -> "휴대폰 결제";
		case EASY_PAY -> "간편결제";
		};
	}

	private String toPaymentStatusLabel(String status) {
		return switch (status) {
		case "PAID" -> "결제 완료";
		case "REFUNDED" -> "환불 완료";
		case "READY" -> "결제 대기";
		case "FAILED" -> "결제 실패";
		case "CANCELED" -> "결제 취소";
		case "PARTIAL_CANCELED" -> "부분 취소";
		default -> status;
		};
	}

	private String buildPaymentDetail(Payment payment, String status) {
		String method = toPaymentMethodLabel(payment.getPayMethod());
		String date = resolvePaymentDate(payment);
		if ("REFUNDED".equals(status) && method != null && date != null) {
			return method + " 환불 · " + date;
		}
		if (method != null && date != null) {
			return method + " · " + date;
		}
		return method != null ? method : date;
	}

	private String resolvePaymentDate(Payment payment) {
		if (payment.getApprovedAt() != null) {
			return DATE_FORMAT.format(payment.getApprovedAt());
		}
		if (payment.getCanceledAt() != null) {
			return DATE_FORMAT.format(payment.getCanceledAt());
		}
		return payment.getRegDate() != null ? DATE_FORMAT.format(payment.getRegDate()) : null;
	}

	private String toProviderLabel(String providerCode) {
		if (providerCode == null) {
			return null;
		}
		return switch (providerCode.toUpperCase(Locale.ROOT)) {
		case "KAKAO" -> "카카오 간편 로그인";
		case "NAVER" -> "네이버 간편 로그인";
		case "GOOGLE" -> "구글 간편 로그인";
		case "LOCAL" -> "이메일 로그인";
		default -> providerCode;
		};
	}

	private String toInquiryType(InquiryType type) {
		if (type == null) {
			return null;
		}
		return switch (type) {
		case BOOKING -> "BOOKING";
		case PAYMENT -> "PAYMENT";
		case SYSTEM -> "SYSTEM";
		case MANAGEMENT -> "MANAGEMENT";
		case ETC -> "ETC";
		};
	}

	private String toInquiryStatus(InquiryStatus status) {
		if (status == null) {
			return null;
		}
		return switch (status) {
		case PENDING -> "OPEN";
		case COMPLETED -> "ANSWERED";
		case DELETE -> "CLOSED";
		};
	}

	private String formatDateTime(LocalDateTime value) {
		return value != null ? DATE_TIME_FORMAT.format(value) : "방금 전";
	}

	private long defaultLong(Long value) {
		return value != null ? value : 0L;
	}
}
