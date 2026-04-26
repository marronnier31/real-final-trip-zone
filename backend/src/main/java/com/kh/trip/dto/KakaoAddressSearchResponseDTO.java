package com.kh.trip.dto;

import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class KakaoAddressSearchResponseDTO {
	private List<KakaoAddressDocumentDTO> documents;
}
