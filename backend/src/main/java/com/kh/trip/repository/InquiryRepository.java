package com.kh.trip.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.kh.trip.domain.Inquiry;
import com.kh.trip.domain.enums.InquiryStatus;

public interface InquiryRepository extends JpaRepository<Inquiry, Long>{
	@Query("select i from Inquiry i WHERE i.user.userNo = :userNo and i.status != :status")
	Page<Inquiry> findByUserId(@Param("userNo")Long userNo, Pageable pageable,@Param("status") InquiryStatus status);

	@Query("select i from Inquiry i where i.user.userNo = :userNo and i.status <> com.kh.trip.domain.enums.InquiryStatus.DELETE order by i.updDate desc")
	List<Inquiry> findMypageInquiries(@Param("userNo") Long userNo);
}
