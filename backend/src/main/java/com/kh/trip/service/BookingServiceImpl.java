package com.kh.trip.service;

import java.text.NumberFormat;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.kh.trip.domain.Booking;
import com.kh.trip.domain.MemberGrade;
import com.kh.trip.domain.MileageHistory;
import com.kh.trip.domain.Payment;
import com.kh.trip.domain.Room;
import com.kh.trip.domain.User;
import com.kh.trip.domain.UserCoupon;
import com.kh.trip.domain.enums.BookingStatus;
import com.kh.trip.domain.enums.CouponStatus;
import com.kh.trip.domain.enums.DiscountType;
import com.kh.trip.domain.enums.MemberGradeName;
import com.kh.trip.domain.enums.MileageChangeType;
import com.kh.trip.domain.enums.MileageStatus;
import com.kh.trip.domain.enums.PaymentStatus;
import com.kh.trip.domain.enums.RoomStatus;
import com.kh.trip.dto.BookingDTO;
import com.kh.trip.dto.PageRequestDTO;
import com.kh.trip.dto.PageResponseDTO;
import com.kh.trip.dto.SellerLodgingSalesDTO;
import com.kh.trip.dto.SellerLodgingTypeRatioDTO;
import com.kh.trip.dto.SellerLodgingTypeSalesDTO;
import com.kh.trip.dto.SellerMonthlySalesDTO;
import com.kh.trip.dto.SellerSalesSummaryDTO;
import com.kh.trip.repository.BookingRepository;
import com.kh.trip.repository.MemberGradeRepository;
import com.kh.trip.repository.MileageHistoryRepository;
import com.kh.trip.repository.PaymentRepository;
import com.kh.trip.repository.RoomRepository;
import com.kh.trip.repository.UserCouponRepository;
import com.kh.trip.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@Service
@RequiredArgsConstructor
@Transactional
@Log4j2
public class BookingServiceImpl implements BookingService {

	private static final NumberFormat NUMBER_FORMAT = NumberFormat.getNumberInstance(Locale.KOREA);

	// 이미 있는 결제 취소 로직을 그대로 사용하려고 주입한 service
	private final PaymentService paymentService;

	private final BookingRepository repository;
	private final UserCouponRepository userCouponRepository;
	private final UserRepository userRepository;
	private final RoomRepository roomRepository;
	private final PaymentRepository paymentRepository;
	private final MileageHistoryRepository mileageHistoryRepository;
	private final MemberGradeRepository memberGradeRepository;

	@Override
	public Long save(BookingDTO bookingDTO) {

		User user = userRepository.findById(bookingDTO.getUserNo())
				.orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원 정보입니다."));

		Room room = roomRepository.findById(bookingDTO.getRoomNo())
				.orElseThrow(() -> new IllegalArgumentException("존재하지 않는 객실 정보입니다."));

		if (room.getStatus().equals(RoomStatus.UNAVAILABLE))
			throw new IllegalArgumentException("예약이 불가한 방입니다.");

		boolean isReserved = repository.existsAlreadyBooking(bookingDTO.getRoomNo(), BookingStatus.CANCELED,
				bookingDTO.getCheckInDate().toLocalDate().atStartOfDay(),
				bookingDTO.getCheckOutDate().toLocalDate().atStartOfDay());

		if (isReserved) {
			throw new IllegalArgumentException("선택하신 날짜로는 예약이 불가한 객실입니다.");
		}

		if(bookingDTO.getGuestCount() > room.getMaxGuestCount()) {
			throw new IllegalArgumentException("객실 최대 수용인원을 초과하셨습니다.");
		}
		
		// 숙박 일수 계산 (체크아웃 날짜 - 체크인 날짜)
		Long daysBetween = ChronoUnit.DAYS.between(bookingDTO.getCheckInDate().toLocalDate(),
				bookingDTO.getCheckOutDate().toLocalDate());
		Long roomPrice = room.getPricePerNight() * daysBetween;
		Long totalPrice = roomPrice * bookingDTO.getGuestCount();
		Long discountAmount = 0L;

		UserCoupon userCoupon = null;
		Long couponDiscountAmount = 0L;

		if (bookingDTO.getUserCouponNo() != null) {
			userCoupon = userCouponRepository.findById(bookingDTO.getUserCouponNo())
					.orElseThrow(() -> new IllegalArgumentException("회원이 갖고 있지 않는 쿠폰번호입니다."));
			if (!userCoupon.getStatus().equals(CouponStatus.ACTIVE))
				throw new IllegalArgumentException("사용불가한 쿠폰입니다.");

			// enum에서 만든 로직 사용
			DiscountType type = userCoupon.getCoupon().getDiscountType();
			Long discountValue = userCoupon.getCoupon().getDiscountValue();

			Long discountedPrice = type.calculate(totalPrice, discountValue);
			if (discountedPrice < 0) {
				discountedPrice = 0L;
			}

			couponDiscountAmount = totalPrice - discountedPrice;
			totalPrice = discountedPrice;
		}

		Long requestedMileage = bookingDTO.getMileageUsed() == null ? 0L : bookingDTO.getMileageUsed();
		if (requestedMileage < 0) {
			throw new IllegalArgumentException("마일리지는 0 이상이어야 합니다.");
		}

		if (requestedMileage > user.getMileage()) {
			throw new IllegalArgumentException("보유 마일리지를 초과하여 사용할 수 없습니다.");
		}

		// 입력된 마일리지가 총 가격보다 많으면 총 가격만큼만 사용하도록 로직구성
		Long mileageUsed = Math.min(requestedMileage, totalPrice);
		totalPrice -= mileageUsed;

		discountAmount = couponDiscountAmount + mileageUsed;
		Booking booking = Booking.builder().user(user).userCoupon(userCoupon).room(room).mileageUsed(mileageUsed)
				.checkInDate(bookingDTO.getCheckInDate()).checkOutDate(bookingDTO.getCheckOutDate())
				.guestCount(bookingDTO.getGuestCount()).pricePerNight(Long.valueOf(room.getPricePerNight()))
				.discountAmount(discountAmount).totalPrice(totalPrice)
				.requestMessage(bookingDTO.getRequestMessage()).status(BookingStatus.PENDING).build();
		Booking savedBooking = repository.save(booking);

		if (userCoupon != null) {
			userCoupon.changeUsedAt(LocalDateTime.now());
			userCoupon.changeStatus(CouponStatus.USED);
		}
		
		return savedBooking.getBookingNo();
	}

	@Override
	public BookingDTO findById(Long bookingNo) {
		return entityToDTO(bookingNo);
	}

	@Override
	public PageResponseDTO<BookingDTO> findByUserId(Long userNo, PageRequestDTO pageRequestDTO) {
		Pageable pageable = PageRequest.of(pageRequestDTO.getPage() - 1, pageRequestDTO.getSize(),
				Sort.by("bookingNo").descending());

		Page<Booking> result = repository.findByUserId(userNo, pageable);

		List<BookingDTO> dtoList = entityToDTO(result);

		return PageResponseDTO.<BookingDTO>withAll().dtoList(dtoList).pageRequestDTO(pageRequestDTO)
				.totalCount(result.getTotalElements()).build();
	}

	@Override
	public PageResponseDTO<BookingDTO> findByHostNo(Long hostNo, PageRequestDTO pageRequestDTO) {
		Pageable pageable = PageRequest.of(pageRequestDTO.getPage() - 1, pageRequestDTO.getSize(),
				Sort.by("bookingNo").descending());

		Page<Booking> result = repository.findByHostNo(hostNo, pageable);

		List<BookingDTO> dtoList = entityToDTO(result);

		return PageResponseDTO.<BookingDTO>withAll().dtoList(dtoList).pageRequestDTO(pageRequestDTO)
				.totalCount(result.getTotalElements()).build();
	}

	@Override
	public BookingDTO updateStatus(Long bookingNo, String status) {
		return updateStatus(bookingNo, null, status);
	}

	@Override
	public BookingDTO updateStatus(Long bookingNo, Long hostNo, String status) {
		if (hostNo != null) {
			Booking booking = repository.findById(bookingNo)
					.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "존재하지 않는 예약입니다."));
			Long ownerHostNo = booking.getRoom().getLodging().getHost().getHostNo();
			if (!hostNo.equals(ownerHostNo)) {
				throw new ResponseStatusException(HttpStatus.FORBIDDEN, "본인 숙소 예약만 변경할 수 있습니다.");
			}
		}

		BookingStatus nextStatus;
		try {
			nextStatus = BookingStatus.valueOf(status);
		} catch (IllegalArgumentException | NullPointerException error) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "지원하지 않는 예약 상태입니다. status=" + status);
		}

		if (nextStatus == BookingStatus.CONFIRMED) {
			return confirmBooking(bookingNo);
		}
		if (nextStatus == BookingStatus.COMPLETED) {
			complete(bookingNo);
			return findById(bookingNo);
		}
		if (nextStatus == BookingStatus.CANCELED) {
			cancelBooking(bookingNo);
			return findById(bookingNo);
		}

		throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "판매자 화면에서 변경할 수 없는 예약 상태입니다. status=" + status);
	}

	@Override
	public void cancelBooking(Long bookingNo) {
		Booking booking = repository.findById(bookingNo).orElseThrow(
				() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "존재하지 않는 예약입니다. bookingNo=" + bookingNo));

		if (booking.getStatus() == BookingStatus.CANCELED) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 취소된 예약입니다. bookingNo=" + bookingNo);
		}

		if (booking.getStatus() == BookingStatus.COMPLETED) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "숙박 완료된 예약은 취소할 수 없습니다. bookingNo=" + bookingNo);
		}

		if (booking.getStatus() == BookingStatus.CONFIRMED || booking.getStatus() == BookingStatus.PENDING) {
			Payment payment = paymentRepository.findFirstByBooking_BookingNoOrderByPaymentNoDesc(bookingNo)
					.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
							"예약에 대한 결제 정보가 없습니다. bookingNo=" + bookingNo));

			paymentService.cancel(payment.getPaymentNo(), booking.getUser().getUserNo());
			return;
		}
	}

	private BookingDTO confirmBooking(Long bookingNo) {
		Booking booking = repository.findById(bookingNo)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "존재하지 않는 예약입니다."));

		if (booking.getStatus() == BookingStatus.CONFIRMED) {
			return entityToDTO(bookingNo);
		}
		if (booking.getStatus() == BookingStatus.CANCELED) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "취소된 예약은 확정할 수 없습니다.");
		}
		if (booking.getStatus() == BookingStatus.COMPLETED) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 완료된 예약입니다.");
		}
		if (booking.getStatus() != BookingStatus.PENDING) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "대기 상태 예약만 확정할 수 있습니다.");
		}

		Payment payment = paymentRepository.findFirstByBooking_BookingNoOrderByPaymentNoDesc(bookingNo)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, "예약 확정 전 결제 정보가 필요합니다."));

		if (payment.getPaymentStatus() == PaymentStatus.READY) {
			paymentService.complete(payment.getPaymentNo());
			return entityToDTO(bookingNo);
		}
		if (payment.getPaymentStatus() == PaymentStatus.PAID) {
			booking.confirm();
			repository.save(booking);
			return entityToDTO(bookingNo);
		}
		throw new ResponseStatusException(HttpStatus.CONFLICT, "예약 확정과 연결할 수 없는 결제 상태입니다.");

	}

	public List<BookingDTO> entityToDTO(Page<Booking> result) {
		return result.getContent().stream().map(booking -> {
			long totalPrice = defaultLong(booking.getTotalPrice());
			long mileageUsed = defaultLong(booking.getMileageUsed());
			long discountAmount = defaultLong(booking.getDiscountAmount());
			long couponDiscountAmount = Math.max(discountAmount - mileageUsed, 0L);

			return BookingDTO.builder().bookingNo(booking.getBookingNo())
					.userNo(booking.getUser().getUserNo()).roomNo(booking.getRoom().getRoomNo())
					.userName(booking.getUser().getUserName()).lodgingName(booking.getRoom().getLodging().getLodgingName())
					.userCouponNo(booking.getUserCoupon() != null ? booking.getUserCoupon().getUserCouponNo() : null)
					.roomName(booking.getRoom().getRoomName()).checkInDate(booking.getCheckInDate())
					.checkOutDate(booking.getCheckOutDate()).guestCount(booking.getGuestCount())
					.pricePerNight(booking.getPricePerNight()).discountAmount(booking.getDiscountAmount())
					.mileageUsed(booking.getMileageUsed()).totalPrice(booking.getTotalPrice())
					.couponDiscountAmount(couponDiscountAmount)
					.status(booking.getStatus()).requestMessage(booking.getRequestMessage()).regDate(booking.getRegDate())
					.bookingId("B-" + booking.getBookingNo())
					.lodgingId(booking.getRoom().getLodging().getLodgingNo())
					.stay(formatStay(booking.getCheckInDate(), booking.getCheckOutDate()))
					.bookingStatus(booking.getStatus().name())
					.bookingStatusLabel(booking.getStatus().name())
					.price(formatWon(totalPrice))
					.canCancel(booking.getStatus() == BookingStatus.PENDING || booking.getStatus() == BookingStatus.CONFIRMED)
					.canReview(booking.getStatus() == BookingStatus.COMPLETED)
					.canViewPayment(paymentRepository.findFirstByBooking_BookingNoOrderByPaymentNoDesc(booking.getBookingNo()).isPresent())
					.build();
		}).collect(Collectors.toList());
	}

	public BookingDTO entityToDTO(Long bookingNo) {
		Optional<Booking> result = repository.findById(bookingNo);
		Booking booking = result.orElseThrow(() -> new IllegalArgumentException("존재하지 않는 예약번호입니다."));
		long totalPrice = defaultLong(booking.getTotalPrice());
		long mileageUsed = defaultLong(booking.getMileageUsed());
		long discountAmount = defaultLong(booking.getDiscountAmount());
		long couponDiscountAmount = Math.max(discountAmount - mileageUsed, 0L);
		return BookingDTO.builder().bookingNo(booking.getBookingNo()).userNo(booking.getUser().getUserNo())
				.roomNo(booking.getRoom().getRoomNo()).userName(booking.getUser().getUserName())
				.lodgingName(booking.getRoom().getLodging().getLodgingName())
				.userCouponNo(booking.getUserCoupon() != null ? booking.getUserCoupon().getUserCouponNo() : null)
				.roomName(booking.getRoom().getRoomName()).checkInDate(booking.getCheckInDate())
				.checkOutDate(booking.getCheckOutDate()).guestCount(booking.getGuestCount())
				.pricePerNight(booking.getPricePerNight()).discountAmount(booking.getDiscountAmount())
				.mileageUsed(booking.getMileageUsed())
				.totalPrice(booking.getTotalPrice()).couponDiscountAmount(couponDiscountAmount).status(booking.getStatus())
				.requestMessage(booking.getRequestMessage()).regDate(booking.getRegDate())
				.bookingId("B-" + booking.getBookingNo())
				.lodgingId(booking.getRoom().getLodging().getLodgingNo())
				.stay(formatStay(booking.getCheckInDate(), booking.getCheckOutDate()))
				.bookingStatus(booking.getStatus().name())
				.bookingStatusLabel(booking.getStatus().name())
				.price(formatWon(totalPrice))
				.canCancel(booking.getStatus() == BookingStatus.PENDING || booking.getStatus() == BookingStatus.CONFIRMED)
				.canReview(booking.getStatus() == BookingStatus.COMPLETED)
				.canViewPayment(paymentRepository.findFirstByBooking_BookingNoOrderByPaymentNoDesc(booking.getBookingNo()).isPresent())
				.build();
	}

	@Override
	public void complete(Long bookingNo) {
		Booking booking = repository.findById(bookingNo)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "존재하지 않는 예약입니다."));

		if (booking.getStatus() == BookingStatus.COMPLETED) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 숙박 완료된 예약입니다.");
		}

		if (booking.getStatus() == BookingStatus.CANCELED) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "취소된 예약은 완료 처리할 수 없습니다.");
		}

		if (booking.getStatus() != BookingStatus.CONFIRMED) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "예약 확정 상태만 숙박 완료 처리할 수 있습니다.");
		}
		Payment payment = paymentRepository.findFirstByBooking_BookingNoOrderByPaymentNoDesc(bookingNo)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "예약에 대한 결제 정보가 없습니다."));

		boolean alreadyEarned = mileageHistoryRepository.existsByPayment_PaymentNoAndChangeTypeAndStatus(
				payment.getPaymentNo(), MileageChangeType.EARN, MileageStatus.NORMAL);
		if (alreadyEarned) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 적립 처리된 예약입니다.");
		}

		booking.complete();

		User user = booking.getUser();
		user.addTotalSpent(payment.getPaymentAmount());
		user.addStayCount(1L);

		Long earnedMileage = payment.getPaymentAmount() / 100;
		user.addMileage(earnedMileage);

		MileageHistory mileageHistory = MileageHistory.builder().user(user).booking(booking).payment(payment)
				.changeType(MileageChangeType.EARN).changeAmount(earnedMileage).balanceAfter(user.getMileage())
				.reason("숙박 완료 마일리지 적립").status(MileageStatus.NORMAL).build();

		mileageHistoryRepository.save(mileageHistory);
		updateMemberGrade(user);
		userRepository.save(user);
		repository.save(booking);
	}

	private void updateMemberGrade(User user) {
		MemberGradeName gradeName;
		if (user.getTotalSpent() >= 3000000 || user.getStayCount() >= 30) {
			gradeName = MemberGradeName.BLACK;
		} else if (user.getTotalSpent() >= 1500000 || user.getStayCount() >= 15) {
			gradeName = MemberGradeName.GOLD;
		} else if (user.getTotalSpent() >= 500000 || user.getStayCount() >= 5) {
			gradeName = MemberGradeName.SILVER;
		} else {
			gradeName = MemberGradeName.BASIC;
		}

		Optional<MemberGrade> result = memberGradeRepository.findByGradeName(gradeName);
		MemberGrade memberGrade = result
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "등급 정보가 없습니다."));

		user.changeMemberGrade(memberGrade);
	}

	@Override
	@Transactional(readOnly = true)
	public SellerSalesSummaryDTO getSellerSalesSummary(Long hostNo) {
		List<Object[]> rows = repository.getSellerSalesSummary(hostNo);
		long totalBookings = repository.countSellerBookings(hostNo);
		long canceledBookings = repository.countSellerBookingsByStatus(hostNo, BookingStatus.CANCELED);
		List<Object[]> lodgingTypeCountRows = repository.getSellerLodgingTypeCounts(hostNo);
		List<Object[]> lodgingTypeSalesRows = repository.getSellerLodgingTypeSales(hostNo);
		List<Object[]> monthlyRows = repository.getSellerMonthlySales(hostNo,
				YearMonth.now().minusMonths(5).atDay(1).atStartOfDay());

		long totalSalesAmount = 0L;
		long totalBookingCount = 0L;
		List<SellerLodgingSalesDTO> lodgingSales = new ArrayList<>();
		List<SellerLodgingTypeRatioDTO> lodgingTypeRatios = new ArrayList<>();
		List<SellerLodgingTypeSalesDTO> lodgingTypeSales = new ArrayList<>();
		List<SellerMonthlySalesDTO> monthlySales = new ArrayList<>();

		for (Object[] row : rows) {
			Long lodgingNo = ((Number) row[0]).longValue();
			String lodgingName = (String) row[1];
			Long salesAmount = ((Number) row[2]).longValue();
			Long bookingCount = ((Number) row[3]).longValue();

			totalSalesAmount += salesAmount;
			totalBookingCount += bookingCount;

			lodgingSales.add(SellerLodgingSalesDTO.builder().lodgingNo(lodgingNo).lodgingName(lodgingName)
					.salesAmount(salesAmount).bookingCount(bookingCount).build());
		}

		for (Object[] row : lodgingTypeCountRows) {
			lodgingTypeRatios.add(SellerLodgingTypeRatioDTO.builder()
					.lodgingType(String.valueOf(row[0]))
					.lodgingCount(((Number) row[1]).longValue())
					.build());
		}

		for (Object[] row : lodgingTypeSalesRows) {
			lodgingTypeSales.add(SellerLodgingTypeSalesDTO.builder()
					.lodgingType(String.valueOf(row[0]))
					.salesAmount(((Number) row[1]).longValue())
					.bookingCount(((Number) row[2]).longValue())
					.build());
		}

		Map<String, Long> monthlySalesMap = new LinkedHashMap<>();
		for (int i = 5; i >= 0; i--) {
			YearMonth month = YearMonth.now().minusMonths(i);
			monthlySalesMap.put(String.format("%d.%02d", month.getYear(), month.getMonthValue()), 0L);
		}
		for (Object[] row : monthlyRows) {
			monthlySalesMap.put(String.valueOf(row[0]), ((Number) row[1]).longValue());
		}
		for (Map.Entry<String, Long> entry : monthlySalesMap.entrySet()) {
			monthlySales.add(SellerMonthlySalesDTO.builder()
					.monthLabel(entry.getKey())
					.salesAmount(entry.getValue())
					.build());
		}

		double canceledRatio = totalBookings == 0 ? 0D : (double) canceledBookings / (double) totalBookings;

		return SellerSalesSummaryDTO.builder().totalSalesAmount(totalSalesAmount).totalBookingCount(totalBookingCount)
				.canceledRatio(canceledRatio)
				.lodgingTypeRatios(lodgingTypeRatios)
				.lodgingSales(lodgingSales)
				.lodgingTypeSales(lodgingTypeSales)
				.monthlySales(monthlySales)
				.build();
	}

	private String formatStay(LocalDateTime checkIn, LocalDateTime checkOut) {
		if (checkIn == null || checkOut == null) {
			return null;
		}
		return checkIn.toLocalDate() + " - " + checkOut.toLocalDate();
	}

	private String formatWon(long amount) {
		return NUMBER_FORMAT.format(amount) + "원";
	}

	private long defaultLong(Long value) {
		return value != null ? value : 0L;
	}
}
