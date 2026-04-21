package com.kh.trip.domain;

import com.kh.trip.domain.common.BaseTimeEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "REVIEWS")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Review extends BaseTimeEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "seq_reviews")
	@SequenceGenerator(name = "seq_reviews", sequenceName = "SEQ_REVIEWS", allocationSize = 1)
	@Column(name = "REVIEW_NO") // REVIEW_NO 컬럼과 매핑
	private Long reviewNo; // 리뷰 번호

	// Booking 엔티티와 연관관계로 매핑
	@ManyToOne(fetch = FetchType.LAZY) // 여러 리뷰가 하나의 예약에 속할 수 있으므로 다대일 관계
	@JoinColumn(name = "BOOKING_NO", nullable = false) // [추가] 실제 DB의 FK 컬럼명 BOOKING_NO
	private Booking booking; // 어떤 예약에 대한 리뷰인지 Booking 엔티티로 참조

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "USER_NO", nullable = false) // 작성 회원 번호 (필수)
	private User user; // 리뷰 작성자 회원 번호

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "LODGING_NO", nullable = false) // 숙소 번호 (필수)
	private Lodging lodging; // 어떤 숙소에 대한 리뷰인지

	@Column(name = "RATING", nullable = false) // 평점 컬럼
	private Integer rating; // 평점 (1~5)

	@Lob
	@Column(name = "CONTENT", nullable = false) // 리뷰 내용
	private String content; // 리뷰 본문

	public void changeRating(Integer rating) {
		this.rating = rating;
	}

	public void changeContent(String content) {
		this.content = content;
	}
}
