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

	@Query("select l.lodgingType, count(b), sum(b.totalPrice) from Booking b join b.room r join r.lodging l where b.status = :status and b.regDate >= :startDate AND b.regDate < :endDate group by l.lodgingType")
	List<Object[]> monthlySalesAmount(@Param("status")BookingStatus status,@Param("startDate")LocalDateTime startDate,@Param("endDate")LocalDateTime endDate);

	@Query("select sum(b.totalPrice) from Booking b where b.status = :status and b.regDate >= :startDate AND b.regDate < :endDate")
	Long monthlyTotalSalesAmount(@Param("status")BookingStatus status,@Param("startDate")LocalDateTime startDate,@Param("endDate")LocalDateTime endDate);

	@Query("select count(b) from Booking b where b.status = :status and b.regDate >= :startDate AND b.regDate < :endDate")
	Long monthlyTotalBookingCount(@Param("status")BookingStatus status,@Param("startDate")LocalDateTime startDate,@Param("endDate")LocalDateTime endDate);

	// 상태별 예약 개수 세기
	Long countByStatus(BookingStatus status);
	
	@Query(value = """
			select to_char(b.check_in_date, 'YYYY.MM') as month_label, 
				nvl(sum(case 
					when b.status in('CONFIRMED', 'COMPLETED') 
					then b.total_price 
					else 0 
				end), 0) as sales_amount
			from bookings b where b.check_in_date >= :startDate group by to_char(b.check_in_date, 'YYYY.MM') order by month_label
			""", nativeQuery = true)
	List<Object[]> getAdminMonthlySales(@Param("startDate") LocalDateTime startDate);
}
