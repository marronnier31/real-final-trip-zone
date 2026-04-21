package com.kh.trip.domain.enums;

public enum PaymentStatus {
	READY, // 결제 대기
	PAID, // 결제 승인 완료
	FAILED, // 결제 실패
	CANCELED, // 전체 결제 취소
	PARTIAL_CANCELED, // 부분 취소 
	REFUNDED // 환불 완료 상태
}
