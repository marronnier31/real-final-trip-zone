package com.kh.trip.dto.auth;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class TokenRefreshResponseDTO {

	private String grantType;
	private String accessToken;
	private Long accessTokenExpiresIn;
}
