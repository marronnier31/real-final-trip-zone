package com.kh.trip.domain.enums;

public enum CouponStatus {
	ACTIVE, // 활성
	INACTIVE, // 비활성(startDate전)
	DELETE, // 삭제
	EXPIRED, // 기간만료
	USED // 사용완료
}
