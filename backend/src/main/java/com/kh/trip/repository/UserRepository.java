package com.kh.trip.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.kh.trip.domain.User;

public interface UserRepository extends JpaRepository<User, Long> {

	// 이메일로 회원 기본 정보를 조회한다.
	Optional<User> findByEmail(String email);

	// 이메일 중복 여부를 확인한다.
	boolean existsByEmail(String email);

	// 활성/비활성 계정 조회
	List<User> findByEnabled(String enabled);

	// 관리자 회원 목록 조회 (type: name | email | all, enabled: 0 | 1 | all)
	@Query("""
			select u
			from User u
			where (
			:enabled = 'all' or u.enabled = :enabled
			)
			and(
			    :keyword = '' or
			    (:type = 'name' and lower(u.userName) like lower(concat('%', :keyword, '%'))) or
			    (:type = 'email' and lower(u.email) like lower(concat('%', :keyword, '%'))) or
			    (:type = 'all' and (
			        lower(u.userName) like lower(concat('%', :keyword, '%')) or
			        lower(u.email) like lower(concat('%', :keyword, '%'))
			    ))
			)
			""")
	Page<User> searchUsers(
			@Param("type") String type, 
			@Param("keyword") String keyword,
			@Param("enabled") String enabled, Pageable pageable);
}
