package com.kh.trip.security.social;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class GoogleTokenInfoResponse {

	private String sub;
	private String email;
	private String name;
	private String aud;
}
