package com.kh.trip.domain;

import com.kh.trip.domain.common.BaseTimeEntity;
import com.kh.trip.domain.enums.MemberGradeName;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Min;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "MEMBER_GRADES")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class MemberGrade extends BaseTimeEntity {
	@Id
	@Enumerated(EnumType.STRING)
	@Column(name = "GRADE_NAME")
	@Builder.Default
	private MemberGradeName gradeName = MemberGradeName.BASIC;

	@Column(name = "MIN_TOTAL_AMOUNT", nullable = false) // 등급정렬에 쓰일 예정
	@Builder.Default
	@Min(0)
	private Long minTotalAmount = 0L;

	@Column(name = "MIN_STAY_COUNT", nullable = false)
	@Builder.Default
	@Min(0)
	private Long minStayCount = 0L;

	@Column(name = "MILEAGE_RATE", nullable = false)
	@Builder.Default
	@Min(0)
	private Double mileageRate = 0.0;

	@Column(name = "BENEFIT_DESC", length = 500)
	private String benefitDESC;

	@Column(name = "STATUS", nullable = false)
	@Builder.Default
	private Integer status = 1; // 삭제시 false == 0

	public void changeName(MemberGradeName gradeName) {
		this.gradeName = gradeName;
	}

	public void changeMinAmount(Long amount) {
		this.minTotalAmount = amount;
	}

	public void changeMinStayCount(Long count) {
		this.minStayCount = count;
	}

	public void changeMileageRate(Double rate) {
		this.mileageRate = rate;
	}

	public void changeBenefitDESC(String benefit) {
		this.benefitDESC = benefit;
	}

	public void changeStatus(Integer status) {
		this.status = status;
	}
}
