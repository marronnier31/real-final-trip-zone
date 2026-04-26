package com.kh.trip.service;

import java.net.URI;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.util.UriComponentsBuilder;

import com.kh.trip.dto.KakaoAddressDocumentDTO;
import com.kh.trip.dto.KakaoAddressSearchResponseDTO;

@Service
@Transactional(readOnly = true)
public class MapServiceImpl implements MapService {

	private static final String KAKAO_LOCAL_ADDRESS_URL = "https://dapi.kakao.com/v2/local/search/address.json";
	
	private final RestTemplate restTemplate = new RestTemplate();
	
	@Value("${kakao.local.rest-api-key:${kakao.client-id:}}")
	private String kakaoRestApiKey;
	
	@Override
	public Map<String, Double> geocodeAddress(String address) {
		String query = address == null? "" : address.trim();
		if(query.isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "주소를 입력해 주세요");
		}
		if(kakaoRestApiKey == null || kakaoRestApiKey.isBlank()) {
			throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "카카오 지도 키가 설정되지 않았습니다");
		}
		
		HttpHeaders headers = new HttpHeaders();
		headers.set(HttpHeaders.AUTHORIZATION, "KakaoAK" + kakaoRestApiKey);
		headers.setAccept(List.of(MediaType.APPLICATION_JSON));
		
		URI uri = UriComponentsBuilder.fromUriString(KAKAO_LOCAL_ADDRESS_URL).queryParam("query", query)
				.queryParam("analyze_type", "exact").build().encode().toUri();
		try {
			ResponseEntity<KakaoAddressSearchResponseDTO> response = restTemplate.exchange(uri, HttpMethod.GET,
					new HttpEntity<>(headers), KakaoAddressSearchResponseDTO.class);
			
			KakaoAddressSearchResponseDTO body = response.getBody();
			List<KakaoAddressDocumentDTO> documents = (body != null? body.getDocuments() : List.of());
			if(documents.isEmpty()) {
				throw new ResponseStatusException(HttpStatus.NOT_FOUND, "입력한 주소의 좌표를 찾지 못했습니다");
			}
			KakaoAddressDocumentDTO best = documents.stream().filter(item -> item.getRoad_address() != null)
					.findFirst().orElse(documents.get(0));
			
			Double latitude = Double.parseDouble(String.valueOf(best.getY()));
			Double longitude = Double.parseDouble(String.valueOf(best.getX()));
			
			return Map.of("latitude", latitude, "longitude", longitude);
			
		}catch (ResponseStatusException e) {
			throw e;
		}catch (Exception e) {
			throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "주소 좌표를 조회하지 못했습니다", e);
		}
	}

}
