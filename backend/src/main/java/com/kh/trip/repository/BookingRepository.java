package com.kh.trip.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.kh.trip.domain.Booking;
import com.kh.trip.domain.Lodging;
import com.kh.trip.domain.enums.BookingStatus;

import jakarta.persistence.LockModeType;

public interface BookingRepository extends JpaRepository<Booking, Long> {
	@Query("select b from Booking b where b.user.userNo = :userNo")
	Page<Booking> findByUserId(@Param("userNo") Long userNo, Pageable pageable);

	@EntityGraph(attributePaths = { "room", "room.lodging" })
	@Query("select b from Booking b where b.user.userNo = :userNo order by b.regDate desc")
	List<Booking> findMypageBookings(@Param("userNo") Long userNo);

	@Query("select b from Booking b join b.room r where r.lodging.host.hostNo = :hostNo")
	Page<Booking> findByHostNo(@Param("hostNo") Long hostNo, Pageable pageable);

	@Query("select r.lodging from Booking b join b.room r where b.user.userNo = :userNo")
	List<Lodging> findLodgingByUserId(@Param("userNo") Long userNo);

	/**
	 * 리뷰 작성 검증용 상세 조회 bookingNo로 예약 1건을 조회하면서 user, room 정보도 같이 가져온다 이유: 1. 로그인한
	 * 사용자의 예약인지 확인 2. 이 예약이 현재 숙소에 대한 예약인지 확인
	 */
	@Query("select b from Booking b join fetch b.user u join fetch b.room r join fetch r.lodging where b.bookingNo = :bookingNo")
	Optional<Booking> findDetailByBookingNo(@Param("bookingNo") Long bookingNo);

	@Query("select b.bookingNo from Booking b where b.checkOutDate <= :today and b.status = :status")
	List<Long> findBookingNosToComplete(@Param("today") LocalDateTime today, @Param("status") BookingStatus status);

	// 비관적 잠금은 단순히 데이터를 수정할 때뿐만 아니라, "내가 읽은 상태가 변하지 않음을 보장받아야 할 때" 사용
	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@Query("select count(b) > 0 from Booking b where b.room.roomNo = :roomNo and b.status != :status and b.checkInDate < :checkOutDate and b.checkOutDate > :checkInDate")
	boolean existsAlreadyBooking(@Param("roomNo") Long roomNo, @Param("status") BookingStatus status,
			@Param("checkInDate") LocalDateTime checkInDate, @Param("checkOutDate") LocalDateTime checkOutDate);

	/**
	 * 특정 호스트(hostNo)가 보유한 숙소 목록을 기준으로
	 * 숙소별 매출 합계와 예약 건수를 집계하는 JPQL 쿼리이다.
	 *
	 * [조회 대상]
	 * - Lodging(숙소) 엔티티를 기준으로 조회한다.
	 * - where l.host.hostNo = :hostNo 조건으로 특정 호스트의 숙소만 조회한다.
	 *
	 * [조인 구조]
	 * - Lodging l
	 * -> Room r
	 * -> Booking b
	 * - 즉, 숙소 → 방 → 예약 순서로 연결하여 집계한다.
	 *
	 * [left join을 사용한 이유]
	 * - 숙소에 연결된 방이 없거나
	 * - 방에 연결된 예약이 없어도
	 * 숙소 자체는 결과에 포함시키기 위해 left join을 사용한다.
	 * - 따라서 예약이 없는 숙소도 결과에서 빠지지 않고
	 * 매출 0, 예약 건수 0 형태로 조회될 수 있다.
	 *
	 * [조회 컬럼]
	 * 1. l.lodgingNo
	 * - 숙소 번호
	 *
	 * 2. l.lodgingName
	 * - 숙소 이름
	 *
	 * 3. 확정/완료 예약 매출 합계
	 * - b.status 가 CONFIRMED 또는 COMPLETED 인 경우에만
	 * b.totalPrice 를 합산한다.
	 * - 취소, 대기 등 나머지 상태는 0으로 처리한다.
	 * - sum 결과가 null 일 수 있으므로 coalesce(..., 0) 으로 0 처리한다.
	 *
	 * 4. 취소되지 않은 예약 건수
	 * - b.status 가 CANCELED 가 아니면 1로 계산한다.
	 * - CANCELED 이면 0으로 계산한다.
	 * - 이를 sum 하여 취소 제외 예약 건수를 구한다.
	 * - 예약이 아예 없을 경우 null 이 될 수 있으므로 coalesce(..., 0) 으로 0 처리한다.
	 *
	 * [group by]
	 * - l.lodgingNo, l.lodgingName 기준으로 그룹화하여
	 * 숙소별 집계 결과를 만든다.
	 *
	 * [order by]
	 * - 숙소 번호(l.lodgingNo) 기준 내림차순 정렬한다.
	 *
	 * [결과 의미]
	 * - 특정 호스트가 가진 각 숙소마다
	 * 숙소 번호, 숙소 이름,
	 * 확정/완료 예약 기준 총 매출,
	 * 취소 제외 예약 건수를 조회하는 쿼리이다.
	 */
	@Query("""
			    select
			        l.lodgingNo,
			        l.lodgingName,
			        coalesce(sum(case
			            when b.status = BookingStatus.CONFIRMED
			              or b.status = BookingStatus.COMPLETED
			            then b.totalPrice
			            else 0
			        end), 0),
			        coalesce(sum(case
			            when b.status <> BookingStatus.CANCELED
			            then 1
			            else 0
			        end), 0)
			    from Lodging l
			    left join Room r on r.lodging = l
			    left join Booking b on b.room = r
			    where l.host.hostNo = :hostNo
			    group by l.lodgingNo, l.lodgingName
			    order by l.lodgingNo desc
			""")
	List<Object[]> getSellerSalesSummary(@Param("hostNo") Long hostNo);

	@Query("select b from Booking b where b.user.userNo = :userNo and b.room.lodging.lodgingNo = :lodgingNo and b.status in :statuses order by b.bookingNo desc")
	List<Booking> findForInquiryRoom( @Param("userNo") Long userNo, @Param("lodgingNo") Long lodgingNo,  @Param("statuses") List<BookingStatus> statuses,
		    Pageable pageable);
}
