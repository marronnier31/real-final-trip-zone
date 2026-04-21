package com.kh.trip.domain;

import com.kh.trip.domain.common.BaseTimeEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "REVIEW_VISIBILITY")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class ReviewVisibility extends BaseTimeEntity {

	@Id
	@Column(name = "REVIEW_NO")
	private Long reviewNo;

	@Builder.Default
	@Column(name = "VISIBLE", nullable = false)
	private boolean visible = true;

	public void changeVisible(boolean visible) {
		this.visible = visible;
	}
}
