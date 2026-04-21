package com.kh.trip.domain;

import com.kh.trip.domain.common.BaseTimeEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "LODGING_IMAGES")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED) // 기본 생성자 protected
@AllArgsConstructor
@Builder

public class LodgingImage extends BaseTimeEntity {

	@Id // 기본키
	@Column(name = "LODGING_IMAGE_NO")
	private Long imageNo;

	@Column(name = "IMAGE_NO", nullable = false)
	private Long legacyImageNo;

	@Column(name = "LODGING_NO", nullable = false, insertable = false, updatable = false) // 숙소 번호 FK
	private Long lodgingNo;
	
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "LODGING_NO", nullable = false)
	private Lodging lodging;  // DB 저장 담당

	@Column(name = "FILE_NAME", nullable = false, length = 300) // 이미지 경로
	private String fileName;

	@Column(name = "SORT_ORDER", nullable = false) // 정렬 순서
	private Integer sortOrder;
	
	public void changeOrd(Integer sortOrder) {
		this.sortOrder = sortOrder;
	}
	public void changeLodging(Lodging lodging) {
		this.lodging = lodging;
	}

	public void assignImageNo(Long imageNo) {
		this.imageNo = imageNo;
		this.legacyImageNo = imageNo;
	}
}
