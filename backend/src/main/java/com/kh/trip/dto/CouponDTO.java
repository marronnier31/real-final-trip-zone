package com.kh.trip.dto;

import java.time.LocalDateTime;

import com.kh.trip.domain.enums.CouponStatus;
import com.kh.trip.domain.enums.DiscountType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CouponDTO {
	private Long couponNo;
	private Long adminUser;
	private String couponName;
	private DiscountType discountType;
	private Long discountValue;
	private LocalDateTime startDate;
	private LocalDateTime endDate;
	private CouponStatus status;
	private LocalDateTime regDate;
	private LocalDateTime updDate;
}
