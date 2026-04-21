package com.kh.trip.dto;

import java.time.LocalDateTime;
import java.util.List;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

public class MypageDTO {

	@Getter
	@Builder
	@NoArgsConstructor
	@AllArgsConstructor
	public static class HomeResponse {
		private ProfileSummary profileSummary;
		private Overview overview;
		private List<MenuItem> menus;
	}

	@Getter
	@Builder
	@NoArgsConstructor
	@AllArgsConstructor
	public static class Overview {
		private long upcomingBookingCount;
		private long wishlistCount;
		private long availableCouponCount;
		private long paidCount;
	}

	@Getter
	@Builder
	@NoArgsConstructor
	@AllArgsConstructor
	public static class MenuItem {
		private String title;
		private String subtitle;
		private String href;
	}

	@Getter
	@Builder
	@NoArgsConstructor
	@AllArgsConstructor
	public static class ProfileResponse {
		private ProfileSummary summary;
		private List<ProfileDetail> details;
	}

	@Getter
	@Builder
	@NoArgsConstructor
	@AllArgsConstructor
	public static class ProfileSummary {
		private String name;
		private String grade;
		private String gradeHint;
		private String status;
		private String joinedAt;
	}

	@Getter
	@Builder
	@NoArgsConstructor
	@AllArgsConstructor
	public static class ProfileDetail {
		private String label;
		private String value;
	}

	@Getter
	@Builder
	@NoArgsConstructor
	@AllArgsConstructor
	public static class BookingResponse {
		private BookingSummary summary;
		private List<BookingItem> items;
	}

	@Getter
	@Builder
	@NoArgsConstructor
	@AllArgsConstructor
	public static class BookingSummary {
		private long totalCount;
		private long upcomingCount;
		private long completedCount;
		private long canceledCount;
	}

	@Getter
	@Builder
	@NoArgsConstructor
	@AllArgsConstructor
	public static class BookingItem {
		private Long bookingNo;
		private String bookingId;
		private Long lodgingId;
		private String lodgingName;
		private String name;
		private Long roomId;
		private String roomName;
		private String checkInDate;
		private String checkOutDate;
		private String stay;
		private long guestCount;
		private String status;
		private String bookingStatus;
		private String bookingStatusLabel;
		private long bookingAmount;
		private String price;
		private boolean canCancel;
		private boolean canReview;
		private boolean canViewPayment;
	}

	@Getter
	@Builder
	@NoArgsConstructor
	@AllArgsConstructor
	public static class BookingCreateRequest {
		@NotNull
		private Long roomNo;
		private Long userCouponNo;
		@NotNull
		private LocalDateTime checkInDate;
		@NotNull
		private LocalDateTime checkOutDate;
		@NotNull
		@Positive
		private Long guestCount;
		private String requestMessage;
	}

	@Getter
	@Builder
	@NoArgsConstructor
	@AllArgsConstructor
	public static class BookingCreatedResponse {
		private Long bookingNo;
		private String bookingId;
		private String bookingStatus;
		private String bookingStatusLabel;
		private long totalPrice;
		private String amount;
		private LocalDateTime createdAt;
	}

	@Getter
	@Builder
	@NoArgsConstructor
	@AllArgsConstructor
	public static class CouponResponse {
		private CouponSummary summary;
		private List<CouponItem> items;
	}

	@Getter
	@Builder
	@NoArgsConstructor
	@AllArgsConstructor
	public static class CouponSummary {
		private long availableCount;
		private long expiringSoonCount;
		private long usedCount;
	}

	@Getter
	@Builder
	@NoArgsConstructor
	@AllArgsConstructor
	public static class CouponItem {
		private Long id;
		private Long userCouponId;
		private String couponName;
		private String name;
		private String couponType;
		private long discountValue;
		private String discountLabel;
		private String status;
		private String statusLabel;
		private String expire;
		private String expiredAt;
		private String target;
		private String appliesTo;
		private boolean isUsable;
		private String issuedAt;
	}

	@Getter
	@Builder
	@NoArgsConstructor
	@AllArgsConstructor
	public static class MileageResponse {
		private MileageSummary summary;
		private List<MileageItem> items;
	}

	@Getter
	@Builder
	@NoArgsConstructor
	@AllArgsConstructor
	public static class MileageSummary {
		private long balance;
		private long earnedThisMonth;
		private long usedThisMonth;
	}

	@Getter
	@Builder
	@NoArgsConstructor
	@AllArgsConstructor
	public static class MileageItem {
		private String label;
		private String amount;
		private String time;
		private String type;
	}

	@Getter
	@Builder
	@NoArgsConstructor
	@AllArgsConstructor
	public static class PaymentResponse {
		private PaymentSummary summary;
		private List<PaymentItem> items;
	}

	@Getter
	@Builder
	@NoArgsConstructor
	@AllArgsConstructor
	public static class PaymentSummary {
		private long paymentCount;
		private long paidAmountTotal;
		private long refundAmountTotal;
		private long paidCount;
		private long refundedCount;
		private String recentPaidAmount;
		private String recentRefundedAmount;
	}

	@Getter
	@Builder
	@NoArgsConstructor
	@AllArgsConstructor
	public static class PaymentItem {
		private String paymentId;
		private String bookingId;
		private String bookingNo;
		private String lodgingName;
		private String roomName;
		private long paymentAmount;
		private long refundAmount;
		private String amount;
		private String status;
		private String paymentStatus;
		private String paymentStatusLabel;
		private String paymentMethod;
		private String paymentMethodLabel;
		private String paidAt;
		private String detail;
	}

	@Getter
	@Builder
	@NoArgsConstructor
	@AllArgsConstructor
	public static class WishlistResponse {
		private List<WishlistItem> items;
	}

	@Getter
	@Builder
	@NoArgsConstructor
	@AllArgsConstructor
	public static class WishlistItem {
		private Long lodgingId;
		private String name;
		private String meta;
		private String price;
		private String status;
	}

	@Getter
	@Builder
	@NoArgsConstructor
	@AllArgsConstructor
	public static class InquiryResponse {
		private InquirySummary summary;
		private List<InquiryItem> items;
	}

	@Getter
	@Builder
	@NoArgsConstructor
	@AllArgsConstructor
	public static class InquirySummary {
		private long openCount;
		private long answeredCount;
		private long closedCount;
	}

	@Getter
	@Builder
	@NoArgsConstructor
	@AllArgsConstructor
	public static class InquiryItem {
		private Long id;
		private String title;
		private String type;
		private String status;
		private String actor;
		private String lodging;
		private String bookingNo;
		private String updatedAt;
		private String preview;
	}

	@Getter
	@Builder
	@NoArgsConstructor
	@AllArgsConstructor
	public static class InquiryDetailResponse {
		private Long id;
		private String title;
		private String type;
		private String status;
		private String actor;
		private String lodging;
		private String bookingNo;
		private String updatedAt;
		private String body;
		private List<InquiryMessageItem> messages;
	}

	@Getter
	@Builder
	@NoArgsConstructor
	@AllArgsConstructor
	public static class InquiryMessageItem {
		private String id;
		private String sender;
		private String time;
		private String body;
	}

}
