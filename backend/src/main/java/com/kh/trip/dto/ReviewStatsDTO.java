package com.kh.trip.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewStatsDTO {
	
	private Long totalReviewCount;   // 전체 리뷰 개수
	private Double averageRating;    // 평균 평점
	private Long rating5Count;       // 5점 개수
	private Long rating4Count;       // 4점 개수
	private Long rating3Count;       // 3점 개수
	private Long rating2Count;       // 2점 개수
	private Long rating1Count;       // 1점 개수

}
