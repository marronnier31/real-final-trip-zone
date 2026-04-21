package com.kh.trip.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.kh.trip.domain.UserCoupon;

public interface UserCouponRepository extends JpaRepository<UserCoupon, Long>{
	@Query("select count(uc) > 0 from UserCoupon uc where uc.user.userNo = :userNo and uc.coupon.couponNo = :couponNo and uc.status != 'INACTIVE'")
	Boolean existenceCheck(@Param("userNo") Long userNo,@Param("couponNo") Long couponNo);

	@Query("select uc from UserCoupon uc left join fetch uc.coupon c where uc.user.userNo = :userNo")
	Page<UserCoupon> findByUser(Long userNo, Pageable pageable);

	@Query("select uc from UserCoupon uc left join fetch uc.coupon c where uc.user.userNo = :userNo order by uc.issuedAt desc")
	java.util.List<UserCoupon> findMypageCoupons(@Param("userNo") Long userNo);
}
