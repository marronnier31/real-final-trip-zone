package com.kh.trip.security;

import java.nio.charset.StandardCharsets;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Component
public class JwtProvider {

	// JWT 서명에 사용할 비밀키
	private final SecretKey secretKey;

	// access token 만료 시간(ms)
	private final long accessTokenExpiration;

	// refresh token 만료 시간(ms)
	private final long refreshTokenExpiration;

	public JwtProvider(@Value("${jwt.secret}") String secret,
			@Value("${jwt.access-token-expiration}") long accessTokenExpiration,
			@Value("${jwt.refresh-token-expiration}") long refreshTokenExpiration) {

		// properties에서 읽은 secret 문자열을 JWT 서명용 key 객체로 만든다.
		this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));

		// properties의 초 단위 값을 ms로 바꿔서 저장한다.
		this.accessTokenExpiration = accessTokenExpiration * 1000;
		this.refreshTokenExpiration = refreshTokenExpiration * 1000;
	}

	public String generateAccessToken(AuthUserPrincipal authUser) {
		Date now = new Date();
		Date expireDate = new Date(now.getTime() + accessTokenExpiration);

		// access token에는 사용자 기본 정보와 권한 정보를 담는다.
		return Jwts.builder().setSubject(authUser.getLoginId()).claim("userNo", authUser.getUserNo())
				.claim("userName", authUser.getUserName()).claim("roleNames", authUser.getRoleNames())
				.claim("tokenType", "ACCESS").setIssuedAt(now).setExpiration(expireDate).signWith(secretKey).compact();
	}

	public String generateRefreshToken(AuthUserPrincipal authUser) {
		Date now = new Date();
		Date expireDate = new Date(now.getTime() + refreshTokenExpiration);

		// refresh token은 access token 재발급 용도라 필요한 최소 정보만 담는다.
		return Jwts.builder().setSubject(authUser.getLoginId()).claim("userNo", authUser.getUserNo())
				.claim("tokenType", "REFRESH").setIssuedAt(now).setExpiration(expireDate).signWith(secretKey).compact();
	}

	public Claims getClaims(String token) {
		// 토큰 서명 검증 + 만료 검증을 통과하면 payload를 꺼내준다.
		return Jwts.parserBuilder().setSigningKey(secretKey).build().parseClaimsJws(token).getBody();
	}

	public boolean validateToken(String token) {
		// 토큰이 정상인지 빠르게 true/false로 확인할 때 사용한다.
		try {
			getClaims(token);
			return true;
		} catch (Exception e) {
			return false;
		}
	}

	public String getLoginId(String token) {
		// subject에 저장한 loginId를 꺼낸다.
		return getClaims(token).getSubject();
	}

	public Long getUserNo(String token) {
		// claim에 저장한 userNo를 꺼낸다.
		return getClaims(token).get("userNo", Long.class);
	}

	public String getTokenType(String token) {
		// ACCESS / REFRESH 구분용 claim을 꺼낸다.
		return getClaims(token).get("tokenType", String.class);
	}
}
