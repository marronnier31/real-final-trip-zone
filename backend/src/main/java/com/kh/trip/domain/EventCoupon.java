package com.kh.trip.domain;

import com.kh.trip.domain.common.BaseTimeEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(name = "EVENT_COUPONS")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class EventCoupon extends BaseTimeEntity{
	@Id
	@GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "SEQ_EVENT_COUPONS")
	@SequenceGenerator(name = "SEQ_EVENT_COUPONS", sequenceName = "SEQ_EVENT_COUPONS", allocationSize = 1)
	@Column(name = "EVENT_COUPON_NO")
	private Long eventCouponNo;
	
	@ManyToOne(fetch = FetchType.LAZY) // 지연 로딩으로 성능 최적화
	@JoinColumn(name = "EVENT_NO", nullable = false) // 실제 DB의 FK 컬럼명
	private Event event;

	@ManyToOne(fetch = FetchType.LAZY) // 지연 로딩으로 성능 최적화
	@JoinColumn(name = "COUPON_NO", nullable = false) // 실제 DB의 FK 컬럼명
	private Coupon coupon;
}
