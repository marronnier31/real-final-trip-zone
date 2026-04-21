package com.kh.trip.security.social;

import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

@Component
public class NaverTokenVerifier {

	private static final String NAVER_TOKEN_URL = "https://nid.naver.com/oauth2.0/token";
	private static final String NAVER_USER_INFO_URL = "https://openapi.naver.com/v1/nid/me";
	private static final String SOCIAL_EMAIL_DOMAIN = "@social.local";

	@Value("${naver.client-id}")
	private String naverClientId;

	@Value("${naver.client-secret}")
	private String naverClientSecret;

	@Value("${naver.redirect-uri}")
	private String naverRedirectUri;

	public SocialUserInfo verify(String code, String state) {
		try {
			RestTemplate restTemplate = new RestTemplate();

			HttpHeaders tokenHeaders = new HttpHeaders();
			tokenHeaders.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

			MultiValueMap<String, String> tokenBody = new LinkedMultiValueMap<>();
			tokenBody.add("grant_type", "authorization_code");
			tokenBody.add("client_id", naverClientId);
			tokenBody.add("client_secret", naverClientSecret);
			tokenBody.add("redirect_uri", naverRedirectUri);
			tokenBody.add("code", code);
			tokenBody.add("state", state);

			HttpEntity<MultiValueMap<String, String>> tokenRequest = new HttpEntity<>(tokenBody, tokenHeaders);

			ResponseEntity<Map<String, Object>> tokenResponse = restTemplate.exchange(NAVER_TOKEN_URL, HttpMethod.POST,
					tokenRequest, (Class<Map<String, Object>>) (Class<?>) Map.class);

			Map<String, Object> tokenResponseBody = tokenResponse.getBody();
			if (tokenResponseBody == null) {
				throw new RuntimeException("Naver token response not found");
			}

			String accessToken = (String) tokenResponseBody.get("access_token");
			if (accessToken == null || accessToken.isBlank()) {
				throw new RuntimeException("Naver access token not found");
			}

			HttpHeaders userHeaders = new HttpHeaders();
			userHeaders.setBearerAuth(accessToken);

			HttpEntity<Void> userRequest = new HttpEntity<>(userHeaders);

			ResponseEntity<Map<String, Object>> userResponse = restTemplate.exchange(NAVER_USER_INFO_URL,
					HttpMethod.GET, userRequest, (Class<Map<String, Object>>) (Class<?>) Map.class);

			Map<String, Object> body = userResponse.getBody();
			if (body == null) {
				throw new RuntimeException("Naver user info not found");
			}

			Map<String, Object> response = (Map<String, Object>) body.get("response");
			if (response == null) {
				throw new RuntimeException("Invalid Naver user info");
			}

			String providerUserId = (String) response.get("id");
			String email = (String) response.get("email");
			String userName = (String) response.get("name");

			if (providerUserId == null) {
				throw new RuntimeException("Invalid Naver user info");
			}

			if (email == null || email.isBlank()) {
				email = "naver_" + providerUserId + SOCIAL_EMAIL_DOMAIN;
			}

			return SocialUserInfo.builder().providerCode("NAVER").providerUserId(providerUserId).email(email)
					.userName(userName != null ? userName : email).build();

		} catch (RestClientResponseException e) {
			throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
					"Naver token exchange failed: " + e.getResponseBodyAsString(), e);
		} catch (Exception e) {
			throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Invalid Naver code", e);
		}
	}
}
