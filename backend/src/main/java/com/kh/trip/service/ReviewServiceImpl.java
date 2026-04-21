package com.kh.trip.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.IntStream;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.kh.trip.domain.Booking;
import com.kh.trip.domain.Review;
import com.kh.trip.domain.ReviewImage;
import com.kh.trip.domain.ReviewVisibility;
import com.kh.trip.domain.enums.BookingStatus;
import com.kh.trip.dto.ReviewAdminDTO;
import com.kh.trip.dto.ReviewDTO; 
import com.kh.trip.dto.ReviewStatsDTO;
import com.kh.trip.repository.BookingRepository;
import com.kh.trip.repository.ReviewImageRepository;
import com.kh.trip.repository.ReviewRepository;
import com.kh.trip.repository.ReviewVisibilityRepository;
import com.kh.trip.util.CustomFileUtil;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class ReviewServiceImpl implements ReviewService {

	private final ReviewRepository reviewRepository; // 리뷰 저장/조회 repository
	private final BookingRepository bookingRepository; // 예약 정보 검증용 repository
	private final ReviewImageRepository reviewImageRepository; // 리뷰 이미지 저장,조회,삭제 repository
	private final ReviewVisibilityRepository reviewVisibilityRepository;
	private final CustomFileUtil fileUtil;

	@Override
	public ReviewDTO createReview(Long loginUserNo, ReviewDTO reviewDTO) {
		// 로그인 사용자 번호가 없으면 리뷰 작성 불가
		if (loginUserNo == null) {
			throw new IllegalArgumentException("로그인한 사용자만 리뷰를 작성할 수 있습니다.");
		}

		// 평점이 없거나 범위를 벗어나면 예외
		if (reviewDTO.getRating() == null || reviewDTO.getRating() < 1 || reviewDTO.getRating() > 5) {
			throw new IllegalArgumentException("평점은 1점부터 5점까지 가능합니다.");
		}

		// 리뷰 내용이 비어 있으면 예외
		if (reviewDTO.getContent() == null || reviewDTO.getContent().isBlank()) {
			throw new IllegalArgumentException("리뷰 내용은 필수입니다.");
		}

		// 숙소 번호가 없으면 예외
		if (reviewDTO.getLodgingNo() == null) {
			throw new IllegalArgumentException("숙소 번호는 필수입니다.");
		}

		// 예약 번호가 없으면 예외
		if (reviewDTO.getBookingNo() == null) {
			throw new IllegalArgumentException("예약 번호는 필수입니다.");
		}

		// 같은 예약번호로 이미 리뷰가 있는지 확인
		// 예약당 리뷰 1개만 허용하려면 반드시 필요
		if (reviewRepository.existsByBooking_BookingNo(reviewDTO.getBookingNo())) {
			throw new IllegalArgumentException("이미 해당 예약에 대한 리뷰가 존재합니다.");
		}

		// 예약 정보 조회
		// 이 예약이 실제 존재하는지, 누구 예약인지, 어떤 숙소 예약인지 확인하기 위해 필요
		Booking booking = bookingRepository.findDetailByBookingNo(reviewDTO.getBookingNo())
				.orElseThrow(() -> new IllegalArgumentException("존재하지 않는 예약입니다."));

		// 본인 예약인지 확인
		if (!booking.getUser().getUserNo().equals(loginUserNo)) {
			throw new IllegalArgumentException("본인의 예약에 대해서만 리뷰를 작성할 수 있습니다.");
		}

		// lodgingNo가 넘어온 경우에만 추가 검증
		if (reviewDTO.getLodgingNo() != null
				&& !booking.getRoom().getLodging().getLodgingNo().equals(reviewDTO.getLodgingNo())) {
			throw new IllegalArgumentException("예약한 숙소에 대해서만 리뷰를 작성할 수 있습니다.");
		}

		// 투숙 완료 상태(COMPLETED)인지 확인
		if (booking.getStatus() != BookingStatus.COMPLETED) {
			throw new IllegalArgumentException("투숙 완료된 예약에 대해서만 리뷰를 작성할 수 있습니다.");
		}

		// 리뷰 엔티티 생성
		Review review = Review.builder().booking(booking) // Booking 엔티티 세팅
				.user(booking.getUser()) // 작성자는 로그인한 사용자 엔티티로 저장
				.lodging(booking.getRoom().getLodging()) // 숙소 엔티티 세팅
				.rating(reviewDTO.getRating()) // 평점 세팅
				.content(reviewDTO.getContent().trim()) // 공백 제거 후 저장
				.build(); // 엔티티 생성

		// DB에 저장
		Review savedReview = reviewRepository.save(review);

		// 리뷰 이미지 저장
		saveReviewImages(savedReview, reviewDTO.getImageUrls());

		// 저장된 리뷰 이미지 URL 목록 실제 조회
		List<String> imageUrls = reviewImageRepository
				.findByReview_ReviewNoOrderBySortOrderAsc(savedReview.getReviewNo()).stream()
				.map(ReviewImage::getImageUrl).toList();

		return toReviewDTO(savedReview, imageUrls); // ReviewDTO 반환
	}

	@Override
	public ReviewDTO updateReview(Long loginUserNo, Long reviewNo, ReviewDTO reviewDTO) {
		// 로그인 사용자 번호가 없으면 리뷰 수정 불가
		if (loginUserNo == null) {
			throw new IllegalArgumentException("로그인한 사용자만 리뷰를 수정할 수 있습니다.");
		}

		// 리뷰 번호가 없으면 예외
		if (reviewNo == null) {
			throw new IllegalArgumentException("리뷰 번호는 필수입니다.");
		}

		// 수정 DTO가 없으면 예외
		if (reviewDTO == null) {
			throw new IllegalArgumentException("수정할 리뷰 정보가 없습니다.");
		}

		// 평점이 없거나 범위를 벗어나면 예외
		if (reviewDTO.getRating() == null || reviewDTO.getRating() < 1 || reviewDTO.getRating() > 5) {
			throw new IllegalArgumentException("평점은 1점부터 5점까지 가능합니다.");
		}

		// 리뷰 내용이 비어 있으면 예외
		if (reviewDTO.getContent() == null || reviewDTO.getContent().isBlank()) {
			throw new IllegalArgumentException("리뷰 내용은 필수입니다.");
		}

		// 리뷰 조회
		Review review = reviewRepository.findByReviewNo(reviewNo)
				.orElseThrow(() -> new IllegalArgumentException("해당 리뷰를 찾을 수 없습니다."));

		// 본인 리뷰만 수정 가능
		if (!review.getUser().getUserNo().equals(loginUserNo)) {
			throw new IllegalArgumentException("본인이 작성한 리뷰만 수정할 수 있습니다.");
		}

		// 부분 수정
		if (reviewDTO.getRating() != null) {
			if (reviewDTO.getRating() < 1 || reviewDTO.getRating() > 5) {
				throw new IllegalArgumentException("평점은 1점부터 5점까지 가능합니다.");
			}
			review.changeRating(reviewDTO.getRating());
		}

		if (reviewDTO.getContent() != null) {
			if (reviewDTO.getContent().isBlank()) {
				throw new IllegalArgumentException("리뷰 내용은 비워둘 수 없습니다.");
			}
			review.changeContent(reviewDTO.getContent().trim());
		}

		Review updatedReview = reviewRepository.save(review);

		// imageUrl이 넘어온 경우에만 이미지가 교체
		if (reviewDTO.getImageUrls() != null) {
			reviewImageRepository.deleteByReview_ReviewNo(reviewNo);
			saveReviewImages(updatedReview, reviewDTO.getImageUrls());
		}

		// 수정 후 이미지 URL 목록 실제 조회
		List<String> imageUrls = reviewImageRepository.findByReview_ReviewNoOrderBySortOrderAsc(reviewNo).stream()
				.map(ReviewImage::getImageUrl).toList();

		return toReviewDTO(updatedReview, imageUrls); // ReviewDTO 반환
	}

	@Override
	public void deleteReview(Long loginUserNo, Long reviewNo) {
		// 로그인 사용자 번호가 없으면 리뷰 삭제 불가
		if (loginUserNo == null) {
			throw new IllegalArgumentException("로그인한 사용자만 리뷰를 삭제할 수 있습니다.");
		}

		// 리뷰 번호가 없으면 예외
		if (reviewNo == null) {
			throw new IllegalArgumentException("리뷰 번호는 필수입니다.");
		}

		// 리뷰 조회
		Review review = reviewRepository.findByReviewNo(reviewNo)
				.orElseThrow(() -> new IllegalArgumentException("해당 리뷰를 찾을 수 없습니다."));

		// 본인 리뷰만 삭제 가능
		if (!review.getUser().getUserNo().equals(loginUserNo)) {
			throw new IllegalArgumentException("본인이 작성한 리뷰만 삭제할 수 있습니다.");
		}

		// 리뷰 삭제 전에 REVIEW_IMAGES부터 먼저 삭제
		reviewImageRepository.deleteByReview_ReviewNo(reviewNo);
		reviewRepository.delete(review);
	}

	// 숙소별 리뷰 목록 조회
	@Override
	@Transactional(readOnly = true)
	public List<ReviewDTO> getReviewsByLodging(Long lodgingNo) {

		if (lodgingNo == null) {
			throw new IllegalArgumentException("숙소 번호는 필수입니다.");
		}

		// 특정 숙소의 리뷰들을 조회하면서, 각 리뷰의 이미지도 실제 조회해서 DTO에 포함
		List<Review> visibleReviews = filterVisibleReviews(reviewRepository.findByLodging_LodgingNoOrderByReviewNoDesc(lodgingNo));

		return visibleReviews.stream().map(review -> {
			List<String> imageUrls = reviewImageRepository
					.findByReview_ReviewNoOrderBySortOrderAsc(review.getReviewNo()).stream()
					.map(ReviewImage::getImageUrl).toList();

			return toReviewDTO(review, imageUrls);
		}).toList();
	}

	// 숙소별 리뷰 통계 조회
	@Override
	@Transactional(readOnly = true)
	public ReviewStatsDTO getReviewStatsByLodging(Long lodgingNo) {
		// 숙소 번호 검증
		if (lodgingNo == null) {
			throw new IllegalArgumentException("숙소 번호는 필수입니다.");
		}

		List<Review> reviews = filterVisibleReviews(reviewRepository.findByLodging_LodgingNo(lodgingNo));

		// 전체 리뷰 개수
		long totalReviewCount = reviews.size();

		// 별점별 개수
		long rating5Count = reviews.stream().filter(review -> review.getRating() == 5).count();
		long rating4Count = reviews.stream().filter(review -> review.getRating() == 4).count();
		long rating3Count = reviews.stream().filter(review -> review.getRating() == 3).count();
		long rating2Count = reviews.stream().filter(review -> review.getRating() == 2).count();
		long rating1Count = reviews.stream().filter(review -> review.getRating() == 1).count();

		// 평균 평점 계산
		double averageRating = 0.0;

		if (totalReviewCount > 0) {
			double sum = reviews.stream().mapToInt(Review::getRating).sum();
			averageRating = sum / totalReviewCount;
			// 소수점 1자리까지 반올림
			averageRating = BigDecimal.valueOf(averageRating).setScale(1, RoundingMode.HALF_UP).doubleValue();
		}

		return toReviewStatsDTO(totalReviewCount, averageRating, rating5Count, rating4Count, rating3Count, rating2Count,
				rating1Count);
	}

	@Override
	@Transactional(readOnly = true)
	public List<ReviewAdminDTO> getAdminReviews() {
		List<Review> reviews = reviewRepository.findAll().stream()
				.sorted((left, right) -> right.getReviewNo().compareTo(left.getReviewNo()))
				.toList();
		Map<Long, Boolean> visibilityMap = loadVisibilityMap(reviews);

		return reviews.stream()
				.map(review -> toReviewAdminDTO(review, visibilityMap.getOrDefault(review.getReviewNo(), true)))
				.toList();
	}

	@Override
	public ReviewAdminDTO updateReviewVisibility(Long reviewNo, String status) {
		Review review = reviewRepository.findByReviewNo(reviewNo)
				.orElseThrow(() -> new IllegalArgumentException("해당 리뷰를 찾을 수 없습니다."));

		boolean visible;
		if ("VISIBLE".equals(status)) {
			visible = true;
		} else if ("HIDDEN".equals(status)) {
			visible = false;
		} else {
			throw new IllegalArgumentException("지원하지 않는 리뷰 상태입니다. status=" + status);
		}

		ReviewVisibility reviewVisibility = reviewVisibilityRepository.findById(reviewNo)
				.orElse(ReviewVisibility.builder().reviewNo(reviewNo).build());
		reviewVisibility.changeVisible(visible);
		reviewVisibilityRepository.save(reviewVisibility);

		return toReviewAdminDTO(review, visible);
	}

	@Override
	public List<String> uploadReviewImages(List<MultipartFile> files) {
		if (files == null || files.isEmpty()) {
			return List.of();
		}

		List<MultipartFile> validFiles = files.stream()
				.filter(file -> file != null && !file.isEmpty())
				.toList();

		if (validFiles.isEmpty()) {
			return List.of();
		}

		return fileUtil.saveFiles(validFiles);
	}

	// Review 엔티티 + 리뷰 이미지 URL 목록을 합쳐서 ReviewDTO로 변환
	private ReviewDTO toReviewDTO(Review review, List<String> imageUrls) {
		return ReviewDTO.builder() // builder 방식으로 생성
				.reviewNo(review.getReviewNo()) // 리뷰 번호 세팅
				.bookingNo(review.getBooking().getBookingNo()) // Booking 엔티티에서 예약 번호 꺼내기
				.userName(review.getUser().getUserName()) // 작성자 이름
				.userNo(review.getUser().getUserNo()) // 작성자 회원 번호 세팅
				.lodgingNo(review.getLodging().getLodgingNo()) // 숙소 번호 세팅
				.rating(review.getRating()) // 평점 세팅
				.content(review.getContent()) // 리뷰 내용 세팅
				.regDate(review.getRegDate()) // 작성일 세팅
				.updDate(review.getUpdDate()) // 수정일 세팅
				.imageUrls(imageUrls) // 이미지 URL 문자열 목록 세팅
				.build(); // 최종 세팅
	}

	// 이미지 URL 리스트를 REVIEW_IMAGES 테이블에 저장하는 공통 메서드
	private void saveReviewImages(Review review, List<String> imageUrls) {
		if (imageUrls == null || imageUrls.isEmpty()) {
			return;
		}

		// 전달받은 이미지 URL들을 순서대로 REVIEW_IMAGES에 저장
		IntStream.range(0, imageUrls.size()).mapToObj(index -> ReviewImage.builder().review(review) // 어떤 리뷰의 이미지인지
																									// Review 엔티티 자체를 저장
				.imageUrl(imageUrls.get(index)) // 이미지 URL
				.sortOrder(index + 1) // 정렬 순서 1부터 시작
				.build()).forEach(reviewImageRepository::save);
	}

	// Review 통계 정보들을 -> ReviewStatsDTO로 변환
	private ReviewStatsDTO toReviewStatsDTO(long totalCount, double avgRating, long r5, long r4, long r3, long r2,
			long r1) {
		return ReviewStatsDTO.builder().totalReviewCount(totalCount) // 합계
				.averageRating(avgRating) // 평균
				.rating5Count(r5) // 별점 5점
				.rating4Count(r4) // 별점 4점
				.rating3Count(r3) // 별점 3점
				.rating2Count(r2) // 별점 2점
				.rating1Count(r1) // 별점 1점
				.build();
	}

	private List<Review> filterVisibleReviews(List<Review> reviews) {
		Map<Long, Boolean> visibilityMap = loadVisibilityMap(reviews);
		return reviews.stream()
				.filter(review -> visibilityMap.getOrDefault(review.getReviewNo(), true))
				.toList();
	}

	private Map<Long, Boolean> loadVisibilityMap(List<Review> reviews) {
		Map<Long, Boolean> visibilityMap = new HashMap<>();
		if (reviews.isEmpty()) {
			return visibilityMap;
		}

		List<Long> reviewNos = reviews.stream().map(Review::getReviewNo).toList();
		reviewVisibilityRepository.findByReviewNoIn(reviewNos)
				.forEach(item -> visibilityMap.put(item.getReviewNo(), item.isVisible()));
		return visibilityMap;
	}

	private ReviewAdminDTO toReviewAdminDTO(Review review, boolean visible) {
		return ReviewAdminDTO.builder()
				.reviewNo(review.getReviewNo())
				.lodgingNo(review.getLodging().getLodgingNo())
				.lodgingName(review.getLodging().getLodgingName())
				.userNo(review.getUser().getUserNo())
				.userName(review.getUser().getUserName())
				.rating(review.getRating())
				.content(review.getContent())
				.status(visible ? "VISIBLE" : "HIDDEN")
				.regDate(review.getRegDate())
				.build();
	}

}
