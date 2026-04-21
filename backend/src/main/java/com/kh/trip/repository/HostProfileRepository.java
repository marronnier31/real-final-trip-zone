package com.kh.trip.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.kh.trip.domain.HostProfile;

public interface HostProfileRepository extends JpaRepository<HostProfile, Long> {
	
	boolean existsByUser_UserNo(Long userNo);
	
	boolean existsByBusinessNumber(String businessNumber);

	Optional<HostProfile> findByUser_UserNo(Long userNo);
}
