package com.kh.trip.service;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import com.kh.trip.dto.ReviewAdminDTO;
import com.kh.trip.dto.ReviewDTO;
import com.kh.trip.dto.ReviewStatsDTO;

public interface ReviewService {

	// 리뷰 작성
	ReviewDTO createReview(Long loginUserNo, ReviewDTO reviewDTO);

	// 리뷰 수정
	ReviewDTO updateReview(Long loginUserNo, Long reviewNo, ReviewDTO reviewDTO);

	// 리뷰 삭제
	void deleteReview(Long loginUserNo, Long reviewNo);

	// 숙소별 리뷰 목록 조회
	List<ReviewDTO> getReviewsByLodging(Long lodgingNo);

	// 숙소별 리뷰 통계 조회
	ReviewStatsDTO getReviewStatsByLodging(Long lodgingNo);

	List<ReviewAdminDTO> getAdminReviews();

	ReviewAdminDTO updateReviewVisibility(Long reviewNo, String status);

	List<String> uploadReviewImages(List<MultipartFile> files);

}
