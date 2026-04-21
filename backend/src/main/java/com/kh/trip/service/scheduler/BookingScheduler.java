package com.kh.trip.service.scheduler;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.kh.trip.domain.enums.BookingStatus;
import com.kh.trip.repository.BookingRepository;
import com.kh.trip.service.BookingService;

import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class BookingScheduler {
	@Autowired
	private BookingRepository repository;

	@Autowired
	BookingService service;

	@Scheduled(cron = "0 1 11 * * *")
	public void updateBookingStatus() {
		log.info("자동 숙박 완료 스케줄러 실행");
		LocalDateTime today = LocalDateTime.now();

		// 1. 대상 조회
		List<Long> targetIds = repository.findBookingNosToComplete(today, BookingStatus.CONFIRMED);

		// 2. 루프를 돌며 서비스 로직 실행
		for (Long bookingNo : targetIds) {
			try {
				service.complete(bookingNo);
			} catch (Exception e) {
				// 특정 예약 처리 실패가 전체 스케줄러를 중단시키지 않도록 예외 처리
				log.info("예약 번호 " + bookingNo + " 처리 중 오류: " + e.getMessage());
			}
		}
	}

}
