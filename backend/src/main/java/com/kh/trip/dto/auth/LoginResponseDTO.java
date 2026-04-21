package com.kh.trip.dto.auth;

import java.util.List;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class LoginResponseDTO {

	private String grantType;
	private String accessToken;
	private String refreshToken;
	private Long accessTokenExpiresIn;
	private Long refreshTokenExpiresIn;

	private Long userNo;
	private String loginId;
	private String userName;
	private List<String> roleNames;
}
