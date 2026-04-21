package com.kh.trip.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.kh.trip.domain.MemberGrade;
import com.kh.trip.domain.enums.MemberGradeName;

public interface MemberGradeRepository extends JpaRepository<MemberGrade, MemberGradeName>{

	@Query("select m from MemberGrade m where m.gradeName = :grade")
	Optional<MemberGrade> findByGradeName(@Param("grade") MemberGradeName gradeName);
	
}
