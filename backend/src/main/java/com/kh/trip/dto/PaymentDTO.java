package com.kh.trip.dto;

import java.time.LocalDateTime;

import jakarta.validation.constraints.NotNull;
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
public class PaymentDTO {
	private Long paymentNo;
	@NotNull(message = "bookingNo는 필수입니다.")
	private Long bookingNo;
	@NotNull(message = "paymentId는 필수입니다.")
	private String paymentId;
	private String storeId;
	private String channelKey;
	private String orderName;
	private Long paymentAmount;
	private String currency;
	private String payMethod;
	private String pgProvider;
	private String paymentStatus;
	private LocalDateTime approvedAt;
	private LocalDateTime canceledAt;
	private Long refundAmount;
	private String failReason;
	private String rawResponse;
	private String bookingId;
	private String lodgingName;
	private String roomName;
	private String amount;
	private String paymentStatusLabel;
	private String paymentMethodLabel;
	private String paidAt;
	private String detail;
}
