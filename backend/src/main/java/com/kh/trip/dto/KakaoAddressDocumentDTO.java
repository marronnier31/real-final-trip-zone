package com.kh.trip.dto;

import java.util.Map;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class KakaoAddressDocumentDTO {
	private String x;
	private String y;
	private Map<String, Object> road_address;
}
