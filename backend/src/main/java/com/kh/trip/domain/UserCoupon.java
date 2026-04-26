package com.kh.trip.domain;
import java.time.LocalDateTime;

import com.kh.trip.domain.common.BaseTimeEntity;
import com.kh.trip.domain.enums.CouponStatus;

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
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "USER_COUPONS")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class UserCoupon extends BaseTimeEntity{
	@Id
	@GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "seq_user_coupons")
	@SequenceGenerator(name = "seq_user_coupons", sequenceName = "SEQ_USER_COUPONS", allocationSize = 1)
	@Column(name = "USER_COUPON_NO")
	private Long userCouponNo;

	@ManyToOne(fetch = FetchType.LAZY) // 지연 로딩으로 성능 최적화
	@JoinColumn(name = "USER_NO", nullable = false) // 실제 DB의 FK 컬럼명
	private User user;

	@ManyToOne(fetch = FetchType.LAZY) // 지연 로딩으로 성능 최적화
	@JoinColumn(name = "COUPON_NO", nullable = false) // 실제 DB의 FK 컬럼명
	private Coupon coupon;

	@Column(name = "ISSUED_AT", nullable = false)
	private LocalDateTime issuedAt;

	@Column(name = "USED_AT")
	private LocalDateTime usedAt;

	@Enumerated(EnumType.STRING)
	@Column(name = "STATUS", nullable = false)
	@Builder.Default
	private CouponStatus status = CouponStatus.ACTIVE; // active,expired, used

	public void changeStatus(CouponStatus status) {
		this.status = status;
	}
	
	public void changeUsedAt(LocalDateTime usedAt) {
		this.usedAt = usedAt;
	}
	
	public CouponStatus determineFinalStatus() {
	    // 이미 사용 기록(날짜)이 있다면 USED
	    if (this.usedAt != null) {
	        this.status = CouponStatus.USED;
	        return this.status; 
	    }
	 

	    // 기간 및 원본 쿠폰 상태 확인 로직
	    LocalDateTime now = LocalDateTime.now();
	    if (this.coupon != null && this.coupon.getEndDate().isBefore(now)) {
	        this.status = CouponStatus.EXPIRED;
	    } else if (this.coupon != null && this.coupon.getStatus() == CouponStatus.INACTIVE) {
	        this.status = CouponStatus.INACTIVE;
	    } else {
	    	//기본값설정
	        this.status = CouponStatus.ACTIVE;
	    }
	    // 최종 결정된 상태
	    return this.status; 
	}
	
	public void restore() {
		// 사용 일시 초기화
		this.usedAt = null; 
		// 원본 쿠폰의 상태 따라감.
		determineFinalStatus();
	}
}
