package com.kh.trip.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.kh.trip.domain.UserRefreshToken;

public interface UserRefreshTokenRepository extends JpaRepository<UserRefreshToken, Long> {

	// refresh token 문자열로 토큰 정보를 조회한다.
	Optional<UserRefreshToken> findByTokenValue(String tokenValue);

	// 특정 회원의 refresh token 목록을 조회한다.
	List<UserRefreshToken> findByUserNo(Long userNo);

	// 특정 회원이 가진 특정 refresh token을 조회한다.
	Optional<UserRefreshToken> findByUserNoAndTokenValue(Long userNo, String tokenValue);

}
