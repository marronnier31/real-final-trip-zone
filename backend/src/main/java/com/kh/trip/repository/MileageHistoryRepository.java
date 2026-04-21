package com.kh.trip.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.kh.trip.domain.MileageHistory;
import com.kh.trip.domain.enums.MileageChangeType;
import com.kh.trip.domain.enums.MileageStatus;

public interface MileageHistoryRepository extends JpaRepository<MileageHistory, Long> {

	List<MileageHistory> findByPayment_PaymentNo(Long paymentNo);

	Page<MileageHistory> findByUser_UserNoOrderByRegDateDesc(Long userNo, Pageable pageable);

	boolean existsByPayment_PaymentNoAndChangeTypeAndStatus(Long paymentNo, MileageChangeType changeType,
			MileageStatus status);

}
