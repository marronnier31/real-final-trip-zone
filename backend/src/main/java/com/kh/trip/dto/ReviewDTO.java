package com.kh.trip.dto;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewDTO {

	private Long reviewNo; // 리뷰 번호
	private Long bookingNo; // 어떤 예약에 대한 리뷰인지
	private Long userNo; // 작성 회원 번호
	private Long lodgingNo; // 어떤 숙소에 대한 리뷰인지
	private String userName; // 작성자명
	private Integer rating; // 평점
	private String content; // 리뷰 내용
	private LocalDateTime regDate; // 작성일
	private LocalDateTime updDate; // 수정일

	// 리뷰 이미지 URL 목록
	@Builder.Default
	private List<String> imageUrls = new ArrayList<>();
}