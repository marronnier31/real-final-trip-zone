package com.kh.trip.repository;

import java.time.LocalDateTime;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.kh.trip.domain.Coupon;
import com.kh.trip.domain.enums.CouponStatus;

public interface CouponRepository extends JpaRepository<Coupon, Long> {

	@Modifying
	@Query("update Coupon c set c.status = :after where c.endDate <= :today and c.status = :before")
	void updateStatusForEndDate(@Param("today")LocalDateTime today,@Param("after")CouponStatus expired,@Param("before")CouponStatus active);

	@Modifying
	@Query("update Coupon c set c.status = :after where c.startDate <= :today and c.status = :before")
	void updateStatusForStartDate(@Param("today")LocalDateTime today, @Param("before")CouponStatus inactive, @Param("after")CouponStatus active);

}
