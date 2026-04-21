package com.kh.trip.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.kh.trip.domain.InquiryRoom;
import com.kh.trip.domain.enums.InquiryRoomStatus;

public interface InquiryRoomRepository extends JpaRepository<InquiryRoom, Long>{

	@Query("select r from InquiryRoom r where r.user.userNo = :userNo and r.host.hostNo = :hostNo and r.lodging.lodgingNo = :lodgingNo and r.status != :status")
	Optional<InquiryRoom> findByDetail(@Param("userNo") Long userNo,@Param("hostNo") Long hostNo,@Param("lodgingNo") Long lodgingNo,@Param("status") InquiryRoomStatus status);

	@Query("select r from InquiryRoom r where r.host.hostNo = :hostNo and r.status != :status order by r.updDate desc")
	List<InquiryRoom> findByHostNo(@Param("hostNo") Long hostNo, @Param("status") InquiryRoomStatus status);
	
	@Query("select r from InquiryRoom r where r.user.userNo = :userNo and r.status != :status order by r.updDate desc")
	List<InquiryRoom> findByUserNo(@Param("userNo") Long userNo, @Param("status") InquiryRoomStatus status);

	@Query("""
			select distinct r
			from InquiryRoom r
			left join fetch r.user u
			left join fetch r.host h
			left join fetch h.user hu
			left join fetch r.lodging l
			where r.inquiryRoomNo = :roomNo
			""")
	// 메시지 송수신 시 user/host/lodging 표시값을 같이 쓰기 때문에 상세 조회용 fetch join을 분리했다.
	Optional<InquiryRoom> findDetailById(@Param("roomNo") Long roomNo);

	@Query("""
			select distinct r
			from InquiryRoom r
			left join fetch r.user u
			left join fetch r.host h
			left join fetch h.user hu
			left join fetch r.lodging l
			where r.host.hostNo = :hostNo and r.status != :status
			order by r.updDate desc
			""")
	List<InquiryRoom> findDetailByHostNo(@Param("hostNo") Long hostNo, @Param("status") InquiryRoomStatus status);

	@Query("""
			select distinct r
			from InquiryRoom r
			left join fetch r.user u
			left join fetch r.host h
			left join fetch h.user hu
			left join fetch r.lodging l
			where r.user.userNo = :userNo and r.status != :status
			order by r.updDate desc
			""")
	List<InquiryRoom> findDetailByUserNo(@Param("userNo") Long userNo, @Param("status") InquiryRoomStatus status);

}
