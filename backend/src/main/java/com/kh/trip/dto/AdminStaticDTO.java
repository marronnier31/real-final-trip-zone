package com.kh.trip.dto;

import java.util.List;

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
public class AdminStaticDTO {
	private List<LodgingTypeRatioAllDTO> lodgingTypeRatioAll;
	private Double canceledRatio;
	private List<LodgingTypeAmountMonthlyDTO> lodgingTypeAmountMonthly;
	private Long monthlyTotalSalesAmount;
	private Long monthlyTotalBookingCount;
	private List<AdminMonthlySalesDTO> monthlySales;
}
