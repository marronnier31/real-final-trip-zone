package com.kh.trip.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SellerSalesSummaryDTO {

	private Long totalSalesAmount;
	private Long totalBookingCount;
	private List<SellerLodgingSalesDTO> lodgingSales;
}
