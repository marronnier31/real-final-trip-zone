package com.kh.trip.dto;

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
public class LodgingTypeAmountMonthlyDTO {
	private String lodgingType;
	private Long bookingCount;
	private Long salesAmount;
}
