package com.kh.trip.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.kh.trip.domain.UserAuthProvider;

public interface UserAuthProviderRepository extends JpaRepository<UserAuthProvider, Long> {

	// 일반 로그인 ID로 인증 수단 정보를 조회한다.
	Optional<UserAuthProvider> findByLoginId(String loginId);

	// 소셜 제공자와 제공자 회원 ID로 인증 수단 정보를 조회한다.
	Optional<UserAuthProvider> findByProviderCodeAndProviderUserId(String providerCode, String providerUserId);

	// 특정 회원이 연결한 모든 인증 수단을 조회한다.
	List<UserAuthProvider> findByUserNo(Long userNo);

	// 특정 회원의 특정 제공자 인증 수단을 조회한다.
	Optional<UserAuthProvider> findByUserNoAndProviderCode(Long userNo, String providerCode);

	// 로그인 ID 중복 여부를 확인한다.
	boolean existsByLoginId(String loginId);
}
