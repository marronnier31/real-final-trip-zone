package com.kh.trip.domain;

import com.kh.trip.domain.common.BaseTimeEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "REVIEW_IMAGES")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class ReviewImage extends BaseTimeEntity{

	@Id 
	@GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "seq_review_images") // 시퀀스 사용
	@SequenceGenerator(name = "seq_review_images", // JPA 내부 시퀀스 이름
			sequenceName = "SEQ_REVIEW_IMAGES", // 실제 DB 시퀀스 이름
			allocationSize = 1 // 1씩 증가
	)
	
	@Column(name = "REVIEW_IMAGE_NO") // REVIEW_IMAGE_NO 컬럼과 연결
	private Long reviewImageNo; // 리뷰 이미지 번호

	// REVIEW_NO를 숫자가 아니라 Review 엔티티와의 연관관계로 매핑
	@ManyToOne(fetch = FetchType.LAZY) // 여러 이미지가 하나의 리뷰에 속하므로 다대일 관계
	@JoinColumn(name = "REVIEW_NO", nullable = false) // 실제 DB의 FK 컬럼명 REVIEW_NO
	private Review review; // 어떤 리뷰에 속한 이미지인지 Review 엔티티로 참조

	@Column(name = "IMAGE_URL", nullable = false, length = 300) // 이미지 경로
	private String imageUrl; // 리뷰 이미지 URL

	@Column(name = "SORT_ORDER", nullable = false) // 정렬 순서
	private Integer sortOrder; // 리뷰 이미지 순서

}