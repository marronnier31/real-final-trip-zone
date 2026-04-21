package com.kh.trip.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SellerLodgingSalesDTO {

	private Long lodgingNo;
	private String lodgingName;
	private Long salesAmount;
	private Long bookingCount;
}
