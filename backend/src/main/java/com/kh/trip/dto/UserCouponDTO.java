package com.kh.trip.dto;

import java.time.LocalDateTime;

import com.kh.trip.domain.enums.CouponStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserCouponDTO {
	private Long userCouponNo;
	private Long userNo;
	private Long couponNo;
	private CouponDTO couponDTO;
	private LocalDateTime issuedAt;
	private LocalDateTime usedAt;
	private CouponStatus status;

}
