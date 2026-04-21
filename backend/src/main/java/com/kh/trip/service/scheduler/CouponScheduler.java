package com.kh.trip.service.scheduler;

import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.kh.trip.domain.enums.CouponStatus;
import com.kh.trip.repository.CouponRepository;

@Component
public class CouponScheduler {
	@Autowired
	private CouponRepository couponRepository;
	
	@Scheduled(cron = "0 0 0 * * *")
	@Transactional
	public void updateCouponStatusToExpired() {
		LocalDateTime today = LocalDateTime.now();
		couponRepository.updateStatusForEndDate(today,CouponStatus.EXPIRED, CouponStatus.ACTIVE);
	}
	@Scheduled(cron = "0 0 0 * * *")
	@Transactional
	public void updateCouponStatusToActive() {
		LocalDateTime today = LocalDateTime.now();
		couponRepository.updateStatusForStartDate(today,CouponStatus.INACTIVE, CouponStatus.ACTIVE);
	}
}
