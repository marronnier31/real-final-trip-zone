package com.kh.trip.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.kh.trip.dto.ReviewAdminDTO;
import com.kh.trip.dto.ReviewDTO;
import com.kh.trip.dto.ReviewStatsDTO;
import com.kh.trip.security.AuthUserPrincipal;
import com.kh.trip.service.ReviewService;

import lombok.RequiredArgsConstructor;

/**
 * 리뷰 컨트롤러 리뷰 관련 요청을 처리하는 REST API 컨트롤러
 */
@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

	// 리뷰 서비스 주입
	private final ReviewService reviewService;

	// 리뷰 등록
	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	@PreAuthorize("hasRole('USER')")
	public ReviewDTO createReview(@AuthenticationPrincipal AuthUserPrincipal authUser,
			@RequestBody ReviewDTO reviewDTO) {

		// 로그인한 사용자 정보가 없으면 예외 발생
		if (authUser == null) {
			throw new IllegalArgumentException("로그인한 사용자만 리뷰를 작성할 수 있습니다.");
		}

		// 로그인한 사용자 번호와 리뷰 작성 DTO를 서비스로 전달
		return reviewService.createReview(authUser.getUserNo(), reviewDTO);
	}

	@PostMapping("/images")
	@PreAuthorize("hasRole('USER')")
	public Map<String, List<String>> uploadReviewImages(@AuthenticationPrincipal AuthUserPrincipal authUser,
			@RequestParam List<MultipartFile> files) {

		if (authUser == null) {
			throw new IllegalArgumentException("로그인한 사용자만 리뷰 이미지를 업로드할 수 있습니다.");
		}

		return Map.of("imageUrls", reviewService.uploadReviewImages(files));
	}

	// 리뷰 수정
	@PatchMapping("/{reviewNo}")
	@PreAuthorize("hasRole('USER')")
	public ReviewDTO updateReview(@PathVariable Long reviewNo, @AuthenticationPrincipal AuthUserPrincipal authUser,
			@RequestBody ReviewDTO reviewDTO) {

		if (authUser == null) {
			throw new IllegalArgumentException("로그인한 사용자만 리뷰를 수정할 수 있습니다.");
		}

		return reviewService.updateReview(authUser.getUserNo(), reviewNo, reviewDTO);
	}

	// 리뷰 삭제
	@DeleteMapping("/{reviewNo}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	@PreAuthorize("hasRole('USER')")
	public void deleteReview(@PathVariable Long reviewNo, @AuthenticationPrincipal AuthUserPrincipal authUser) {

		if (authUser == null) {
			throw new IllegalArgumentException("로그인한 사용자만 리뷰를 삭제할 수 있습니다.");
		}

		reviewService.deleteReview(authUser.getUserNo(), reviewNo);
	}

	// 숙소별 리뷰 목록 조회
	@GetMapping("/lodgings/{lodgingNo}")
	public List<ReviewDTO> getReviewsByLodging(@PathVariable Long lodgingNo) {
		return reviewService.getReviewsByLodging(lodgingNo);
	}

	// 숙소별 리뷰 통계 조회
	@GetMapping("/lodgings/{lodgingNo}/stats")
	public ReviewStatsDTO getReviewStatsByLodging(@PathVariable Long lodgingNo) {
		return reviewService.getReviewStatsByLodging(lodgingNo);
	}

	@GetMapping("/admin")
	@PreAuthorize("hasRole('ADMIN')")
	public List<ReviewAdminDTO> getAdminReviews() {
		return reviewService.getAdminReviews();
	}

	@PatchMapping("/{reviewNo}/visibility")
	@PreAuthorize("hasRole('ADMIN')")
	public ReviewAdminDTO updateReviewVisibility(@PathVariable Long reviewNo, @RequestBody Map<String, String> payload) {
		return reviewService.updateReviewVisibility(reviewNo, payload.get("status"));
	}

}
