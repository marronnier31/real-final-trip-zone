package com.kh.trip.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.kh.trip.domain.UserRole;

public interface UserRoleRepository extends JpaRepository<UserRole, Long> {

	// 특정 회원이 보유한 권한 목록을 조회한다.
	List<UserRole> findByUserNo(Long userNo);

	// 특정 회원이 해당 권한을 이미 가지고 있는지 확인한다.
	boolean existsByUserNoAndRoleCode(Long userNo, String roleCode);

	void deleteByUserNoAndRoleCode(Long userNo, String roleCode);
}
