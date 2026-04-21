package com.kh.trip.security.social;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

/**
 * 구글에서 발급한 ID Token을 검증하고 사용자 정보를 추출하는 클래스
 * 
 * - 프론트엔드에서 전달한 구글 로그인용 idToken을 검증 - 구글 tokeninfo API를 호출하여 payload 정보 확인 -
 * 사용자 식별값(sub), 이메일, 이름을 추출하여 GoogleUserInfo로 반환
 */
@Component
public class GoogleTokenVerifier {

	/**
	 * 구글 ID Token 검증용 API 주소 id_token을 쿼리 파라미터로 전달하여 토큰의 유효성을 확인한다.
	 */
	private static final String GOOGLE_TOKEN_INFO_URL = "https://oauth2.googleapis.com/tokeninfo?id_token=";
	@Value("${google.client-id}")
	private String googleClientId;

	/**
	 * 전달받은 Google ID Token을 검증하고 사용자 정보를 반환한다.
	 * 
	 * @param idToken 프론트엔드에서 전달받은 Google ID Token
	 * @return 검증 완료된 Google 사용자 정보 객체
	 * @throws RuntimeException 토큰이 유효하지 않거나 사용자 정보 추출에 실패한 경우
	 */
	public SocialUserInfo verify(String idToken) {
		try {
			RestTemplate restTemplate = new RestTemplate();

			GoogleTokenInfoResponse response = restTemplate.getForObject(GOOGLE_TOKEN_INFO_URL + idToken,
					GoogleTokenInfoResponse.class);

			if (response == null) {
				throw new RuntimeException("Google token verification failed");
			}

			if (response.getAud() == null || !response.getAud().equals(googleClientId)) {
				throw new RuntimeException("Invalid Google token audience");
			}

			String providerUserId = response.getSub();
			String email = response.getEmail();
			String userName = response.getName();

			if (providerUserId == null || email == null) {
				throw new RuntimeException("Invalid Google user info");
			}

			return SocialUserInfo.builder().providerCode("GOOGLE").providerUserId(providerUserId).email(email)
					.userName(userName != null ? userName : email).build();

		} catch (RestClientResponseException e) {
			throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
					"Google token verification failed: " + e.getResponseBodyAsString(), e);
		} catch (Exception e) {
			throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Invalid Google idToken", e);
		}
	}
}
