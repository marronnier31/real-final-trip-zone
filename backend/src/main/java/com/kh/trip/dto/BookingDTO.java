package com.kh.trip.dto;

import java.time.LocalDateTime;

import com.kh.trip.domain.enums.BookingStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingDTO {
	private Long bookingNo;
	private Long userNo;
	private String userName;
	private Long roomNo;
	private Long userCouponNo;
	private LocalDateTime checkInDate;
	private LocalDateTime checkOutDate;
	private Long guestCount;
	private Long pricePerNight;
	private Long discountAmount;
	private Long mileageUsed;
	private Long totalPrice;
	private Long couponDiscountAmount;
	private BookingStatus status;
	private String requestMessage;
	private LocalDateTime regDate;
	private String lodgingName;
	private String roomName;
	private String bookingId;
	private Long lodgingId;
	private String stay;
	private String bookingStatus;
	private String bookingStatusLabel;
	private String price;
	private boolean canCancel;
	private boolean canReview;
	private boolean canViewPayment;
}
