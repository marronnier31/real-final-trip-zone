package com.kh.trip.security;

import java.io.IOException;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

	// JWT 토큰 생성/검증/claim 조회를 담당하는 객체
	private final JwtProvider jwtProvider;

	// 토큰 안의 사용자 번호로 실제 사용자 정보를 다시 조회하는 서비스
	private final CustomUserDetailsService customUserDetailsService;

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
			throws ServletException, IOException {

		// 요청 헤더에서 Authorization 값을 꺼낸다.
		String authorizationHeader = request.getHeader("Authorization");

		// Authorization 헤더가 있고 Bearer 토큰 형식이면 JWT를 꺼낸다.
		if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
			// Bearer 를 제거하고 실제 JWT 문자열만 추출한다.
			String token = authorizationHeader.substring(7);

			// 토큰 서명/만료 여부를 먼저 검증한다.
			if (jwtProvider.validateToken(token)) {

				// 이 토큰이 ACCESS 토큰인지 REFRESH 토큰인지 구분한다.
				String tokenType = jwtProvider.getTokenType(token);

				// 실제 API 인증에는 ACCESS 토큰만 사용한다.
				if ("ACCESS".equals(tokenType)) {

					// 토큰에 저장된 userNo를 꺼내 실제 사용자 정보를 다시 조회한다.
					Long userNo = jwtProvider.getUserNo(token);

					// 토큰 정보만 믿지 않고 DB에서 현재 사용자 상태와 권한을 다시 조회한다.
					AuthUserPrincipal authUser = customUserDetailsService.loadUserByUserNo(userNo);
					// 토큰이 정상이어도 비활성 계정이면 인증하지 않는다.
					if (!authUser.isEnabled()) {
						filterChain.doFilter(request, response);
						return;
					}
					// 스프링 시큐리티가 사용할 인증 객체 생성
					UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
							authUser, null, authUser.getAuthorities());

					// 현재 요청의 부가 정보(IP, 세션 정보 등)를 인증 객체에 저장
					authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

					// 현재 요청을 인증된 사용자 요청으로 등록한다.
					// @AuthenticationPrincipal 사용가능
					SecurityContextHolder.getContext().setAuthentication(authentication);
				}
			}
		}

		// 현재 필터 처리가 끝났으므로 다음 필터 또는 컨트롤러로 요청을 넘긴다.
		filterChain.doFilter(request, response);
	}

	@Override
	protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
		// Preflight 지금 보내는 요청이 유효한지를 확인하기 위해 OPTIONS 메서드로 예비 요청을 보내는 것
		if (request.getMethod().equals("OPTIONS")) {
			return true;
		}

		String path = request.getRequestURI();

		// 이미지 조회 경로는 체크하지 않고 싶을 때
		if (path.startsWith("/api/lodgings/view/")) {
			return true;
		}
		if (path.startsWith("/api/rooms/view/")) {
			return true;
		}
		if (path.startsWith("/api/event/view/")) {
			return true;
		}

		// 웹소켓 연결 경로는 토큰 체크에서 제외
		// (연결 핸드셰이크 시점에 토큰을 검사하기 어렵기 때문)
		if (path.startsWith("/ws")) {
			return true;
		}
		return false;
	}

}