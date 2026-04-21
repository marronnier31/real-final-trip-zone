package com.kh.trip.security.social;

import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@Component
public class KakaoTokenVerifier {

	private static final String KAKAO_TOKEN_URL = "https://kauth.kakao.com/oauth/token";
	private static final String KAKAO_USER_INFO_URL = "https://kapi.kakao.com/v2/user/me";
	private static final String SOCIAL_EMAIL_DOMAIN = "@social.local";

	@Value("${kakao.client-id}")
	private String kakaoClientId;

	@Value("${kakao.client-secret}")
	private String kakaoClientSecret;

	@Value("${kakao.redirect-uri}")
	private String kakaoRedirectUri;

	public SocialUserInfo verify(String code, String redirectUri) {
		try {
			RestTemplate restTemplate = new RestTemplate();
			String resolvedRedirectUri = redirectUri != null && !redirectUri.isBlank() ? redirectUri : kakaoRedirectUri;

			HttpHeaders tokenHeaders = new HttpHeaders();
			tokenHeaders.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

			MultiValueMap<String, String> tokenBody = new LinkedMultiValueMap<>();
			tokenBody.add("grant_type", "authorization_code");
			tokenBody.add("client_id", kakaoClientId);
			tokenBody.add("redirect_uri", resolvedRedirectUri);
			tokenBody.add("code", code);

			if (kakaoClientSecret != null && !kakaoClientSecret.isBlank()) {
				tokenBody.add("client_secret", kakaoClientSecret);
			}

			HttpEntity<MultiValueMap<String, String>> tokenRequest = new HttpEntity<>(tokenBody, tokenHeaders);

			ResponseEntity<Map<String, Object>> tokenResponse = restTemplate.exchange(KAKAO_TOKEN_URL, HttpMethod.POST,
					tokenRequest, (Class<Map<String, Object>>) (Class<?>) Map.class);

			Map<String, Object> tokenResponseBody = tokenResponse.getBody();
			if (tokenResponseBody == null) {
				throw new RuntimeException("Kakao token response not found");
			}

			String accessToken = (String) tokenResponseBody.get("access_token");
			if (accessToken == null || accessToken.isBlank()) {
				throw new RuntimeException("Kakao access token not found");
			}

			HttpHeaders userHeaders = new HttpHeaders();
			userHeaders.setBearerAuth(accessToken);

			HttpEntity<Void> userRequest = new HttpEntity<>(userHeaders);

			ResponseEntity<Map<String, Object>> userResponse = restTemplate.exchange(KAKAO_USER_INFO_URL,
					HttpMethod.GET, userRequest, (Class<Map<String, Object>>) (Class<?>) Map.class);

			Map<String, Object> body = userResponse.getBody();
			if (body == null) {
				throw new RuntimeException("Kakao user info not found");
			}

			Object id = body.get("id");
			Map<String, Object> kakaoAccount = (Map<String, Object>) body.get("kakao_account");
			Map<String, Object> profile = kakaoAccount != null ? (Map<String, Object>) kakaoAccount.get("profile")
					: null;

			String providerUserId = id != null ? String.valueOf(id) : null;
			String email = kakaoAccount != null ? (String) kakaoAccount.get("email") : null;
			String userName = profile != null ? (String) profile.get("nickname") : null;

			if (providerUserId == null) {
				throw new RuntimeException("Invalid Kakao user info");
			}

			if (email == null || email.isBlank()) {
				email = "kakao_" + providerUserId + SOCIAL_EMAIL_DOMAIN;
			}

			return SocialUserInfo.builder().providerCode("KAKAO").providerUserId(providerUserId).email(email)
					.userName(userName != null ? userName : email).build();

		} catch (RestClientResponseException e) {
			throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
					"Kakao token exchange failed: " + e.getResponseBodyAsString(), e);
		} catch (Exception e) {
			throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Invalid Kakao code", e);
		}
	}
}
