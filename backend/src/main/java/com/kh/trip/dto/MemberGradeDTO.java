package com.kh.trip.dto;

import com.kh.trip.domain.enums.MemberGradeName;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MemberGradeDTO {
	private MemberGradeName gradeName;
	private Long minTotalAmount;
	private Long minStayCount;
	private double mileageRate;
	private String benefitDESC;
	private Integer status;
}
