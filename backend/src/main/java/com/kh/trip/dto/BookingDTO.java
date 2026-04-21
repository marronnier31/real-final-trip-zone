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
	private Long mileage;
	private LocalDateTime checkInDate;
	private LocalDateTime checkOutDate;
	private Long guestCount;
	private Long pricePerNight;
	private Long discountAmount;
	private Long totalPrice;
	private BookingStatus status;
	private String requestMessage;
	private LocalDateTime regDate;
	private String lodgingName;
	private String roomName;
}
