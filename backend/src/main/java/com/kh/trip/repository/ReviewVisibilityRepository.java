package com.kh.trip.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.kh.trip.domain.ReviewVisibility;

public interface ReviewVisibilityRepository extends JpaRepository<ReviewVisibility, Long> {

	List<ReviewVisibility> findByReviewNoIn(List<Long> reviewNos);
}
