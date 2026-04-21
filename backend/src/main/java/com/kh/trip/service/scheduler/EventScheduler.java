package com.kh.trip.service.scheduler;

import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.kh.trip.domain.enums.EventStatus;
import com.kh.trip.repository.EventRepository;

@Component
public class EventScheduler {
	@Autowired
	private EventRepository eventRepository;
	
	@Scheduled(cron = "0 0 0 * * *")
	@Transactional
	public void updateEventStatusToActive() {
		LocalDateTime today = LocalDateTime.now();
		eventRepository.updateStatusForStartDate(today, EventStatus.DRAFT, EventStatus.ONGOING);
	}

	@Scheduled(cron = "0 0 0 * * *")
	@Transactional
	public void updateEventStatusToExpired() {
		LocalDateTime today = LocalDateTime.now();
		eventRepository.updateStatusForEndDate(today, EventStatus.ENDED, EventStatus.ONGOING);
	}
}
