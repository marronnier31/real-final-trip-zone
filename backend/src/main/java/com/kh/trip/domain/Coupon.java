package com.kh.trip.domain;

import java.time.LocalDateTime;

import com.kh.trip.domain.common.BaseTimeEntity;
import com.kh.trip.domain.enums.CouponStatus;
import com.kh.trip.domain.enums.DiscountType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Positive;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "COUPONS")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Coupon extends BaseTimeEntity {
	@Id
	@GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "seq_coupons")
	@SequenceGenerator(name = "seq_coupons", sequenceName = "SEQ_COUPONS", allocationSize = 1)
	@Column(name = "COUPON_NO")
	private Long couponNo;

	@ManyToOne(fetch = FetchType.LAZY) // 지연 로딩으로 성능 최적화
	@JoinColumn(name = "ISSUED_BY_USER_NO", nullable = false) // 실제 DB의 FK 컬럼명
	private User user;
	
	@Column(name = "COUPON_NAME", length = 100, unique = true, nullable = false)
	private String couponName;

	@Column(name = "DISCOUNT_TYPE", nullable = false)
	@Enumerated(EnumType.STRING)
	private DiscountType discountType;

	@Column(name = "DISCOUNT_VALUE", nullable = false)
	@Positive
	private Long discountValue;

	@Column(name = "START_DATE", nullable = false)
	private LocalDateTime startDate;

	@Column(name = "END_DATE", nullable = false)
	private LocalDateTime endDate;

	@Enumerated(EnumType.STRING)
	@Column(name = "STATUS", nullable = false)
	@Builder.Default
	private CouponStatus status = CouponStatus.INACTIVE; // active, inactive, delete, expiration

	public void changeCouponName(String couponName) {
		this.couponName = couponName;
	}
	
	public void changeDiscountType(DiscountType discountType) {
		this.discountType = discountType;
	}
	
	public void changeDiscountValue(Long discountValue) {
		this.discountValue = discountValue;
	}
	
	public void changeStartDate(LocalDateTime startDate) {
		this.startDate = startDate;
	}
	
	public void changeEndDate(LocalDateTime endDate) {
		this.endDate = endDate;
	}
	
	public void changeStatus(CouponStatus status) {
		this.status = status;
	}
	
	@PrePersist
	@PreUpdate
	public void validateDates() {
		if (startDate != null && endDate != null) {
			// endDate가 startDate와 같거나 그보다 이전이면 에러 발생
			if (!endDate.isAfter(startDate)) {
				throw new IllegalStateException("종료 일시는 시작 일시보다 최소 1초 이상 뒤여야 합니다.");
			}
		}
	}

}
