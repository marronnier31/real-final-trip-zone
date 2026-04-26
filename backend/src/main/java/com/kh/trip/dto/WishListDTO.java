package com.kh.trip.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class WishListDTO {
	private Long wishListNo;
	private Long userNo;
	private Long lodgingNo;
	private LodgingDTO lodgingDTO;
	private String name;
	private String meta;
	private String price;
	private String status;
}
