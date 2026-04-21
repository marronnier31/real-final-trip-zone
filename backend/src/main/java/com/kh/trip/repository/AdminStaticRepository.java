package com.kh.trip.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.kh.trip.domain.Booking;
import com.kh.trip.domain.enums.BookingStatus;

public interface AdminStaticRepository extends JpaRepository<Booking, Long> {

	@Query("select l.lodgingType, count(b), (count(b)*100.0)/(select count(b2) from Booking b2 where b2.status in :statuses) from Booking b join b.room r join r.lodging l where b.status in :statuses group by l.lodgingType")
	List<Object[]> lodgingTypeRatioAll(List<BookingStatus> statuses);

	@Query("select (count(b)*100.0)/(select count(b2) from Booking b2) from Booking b where b.status = :status")
	Double canceledRatio(@Param("status")BookingStatus status);

	@Query("select l.lodgingType, count(b), sum(b.totalPrice) from Booking b join b.room r join r.lodging l where b.status = :status and b.regDate >= :startDate AND b.regDate < :endDate group by l.lodgingType")
	List<Object[]> monthlySalesAmount(@Param("status")BookingStatus status,@Param("startDate")LocalDateTime startDate,@Param("endDate")LocalDateTime endDate);

	@Query("select sum(b.totalPrice) from Booking b where b.status = :status and b.regDate >= :startDate AND b.regDate < :endDate")
	Long monthlyTotalSalesAmount(@Param("status")BookingStatus status,@Param("startDate")LocalDateTime startDate,@Param("endDate")LocalDateTime endDate);

	@Query("select count(b) from Booking b where b.status = :status and b.regDate >= :startDate AND b.regDate < :endDate")
	Long monthlyTotalBookingCount(@Param("status")BookingStatus status,@Param("startDate")LocalDateTime startDate,@Param("endDate")LocalDateTime endDate);

}
