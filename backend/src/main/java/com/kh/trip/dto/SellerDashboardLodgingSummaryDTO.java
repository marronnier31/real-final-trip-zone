package com.kh.trip.dto;

import com.kh.trip.domain.enums.LodgingStatus;

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
public class SellerDashboardLodgingSummaryDTO {

	private Long lodgingNo;
	private String lodgingName;
	private String region;
	private LodgingStatus status;
	private Integer roomCount;

}
