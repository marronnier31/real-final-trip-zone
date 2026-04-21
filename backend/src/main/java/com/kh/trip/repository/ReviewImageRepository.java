package com.kh.trip.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import com.kh.trip.domain.ReviewImage;

public interface ReviewImageRepository extends JpaRepository<ReviewImage, Long> {

	// 특정 리뷰 번호의 이미지 목록을 정렬 순서대로 조회
	List<ReviewImage> findByReview_ReviewNoOrderBySortOrderAsc(Long reviewNo);
	// 특정 리뷰의 이미지 전체 삭제
	void deleteByReview_ReviewNo(Long reviewNo);
}
