package com.kh.trip.security.social;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class SocialUserInfo {

	private String providerCode;
	private String providerUserId;
	private String email;
	private String userName;
}