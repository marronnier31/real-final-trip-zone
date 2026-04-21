package com.kh.trip.repository;

import java.time.LocalDateTime;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.kh.trip.domain.Event;
import com.kh.trip.domain.enums.EventStatus;

public interface EventRepository extends JpaRepository<Event, Long>{

	Page<Event> findAllByStatusNot(EventStatus status, Pageable pageable);
	
	boolean existsByTitle(String title);

	@Modifying
	@Query("update Event e set e.status = :after where e.status = :before and e.startDate <= :today and e.endDate > :today")
	void updateStatusForStartDate(@Param("today")LocalDateTime today, @Param("before")EventStatus draft, @Param("after")EventStatus ongoing);

	@Modifying
	@Query("update Event e set e.status = :after where e.status = :before and e.startDate <= :today and e.endDate > :today")
	void updateStatusForEndDate(@Param("today")LocalDateTime today,  @Param("after")EventStatus ended, @Param("before")EventStatus ongoing);

}
