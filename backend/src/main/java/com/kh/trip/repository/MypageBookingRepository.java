package com.kh.trip.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.kh.trip.domain.Booking;
import com.kh.trip.domain.enums.BookingStatus;

public interface MypageBookingRepository extends JpaRepository<Booking, Long> {

	@Query("""
			select count(b)
			from Booking b
			where b.room.roomNo = :roomNo
			  and b.status in :statuses
			  and b.checkInDate < :checkOutDate
			  and b.checkOutDate > :checkInDate
			""")
	long countOverlappingBookings(@Param("roomNo") Long roomNo, @Param("checkInDate") LocalDateTime checkInDate,
			@Param("checkOutDate") LocalDateTime checkOutDate, @Param("statuses") List<BookingStatus> statuses);
}
