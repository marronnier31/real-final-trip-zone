package com.kh.trip.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.kh.trip.domain.Coupon;
import com.kh.trip.domain.EventCoupon;

public interface EventCouponRepository extends JpaRepository<EventCoupon, Long>{
	
	@Query("select c from EventCoupon ec left join ec.coupon c where ec.event.eventNo = :eventNo")
	List<Coupon> findCouponsByEventNo(@Param("eventNo") Long eventNo);
	
}
