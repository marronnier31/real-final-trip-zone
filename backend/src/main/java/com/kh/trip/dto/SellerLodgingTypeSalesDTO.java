package com.kh.trip.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SellerLodgingTypeSalesDTO {

	private String lodgingType;
	private Long salesAmount;
	private Long bookingCount;
}
