package com.kh.trip.domain.enums;

public enum DiscountType {
	AMOUNT {
		@Override
		public Long calculate(Long price, Long discount) {
			return price - discount;
		}
	},
	PERCENT {
		@Override
		public Long calculate(Long price, Long discount) {
			return price - (price * discount / 100);
		}
	};

	// 추상 메서드를 선언해서 각 항목이 직접 계산하게 함
	public abstract Long calculate(Long price, Long discount);
}
