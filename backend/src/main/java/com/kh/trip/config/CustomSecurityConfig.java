package com.kh.trip.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import com.kh.trip.security.JwtAuthenticationFilter;

import lombok.RequiredArgsConstructor;

@Configuration
@RequiredArgsConstructor
@EnableMethodSecurity
public class CustomSecurityConfig {
	private final JwtAuthenticationFilter jwtAuthenticationFilter;

	@Bean
	SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
		http
				// JWT 기반 인증이므로 CORS 설정을 활성화한다.
				.cors(cors -> {
				})
				// REST API 방식에서는 CSRF를 비활성화한다.
				.csrf(csrf -> csrf.disable())
				// 세션을 사용하지 않고 요청마다 토큰으로 인증한다.
				.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
				.authorizeHttpRequests(auth -> auth
						// 로그인/로그아웃/재발급/웹소켓 핸드셰이크/이미지 경로는 인증 없이 접근 가능하다.
						.requestMatchers("/", "/ws/**", "/api/view/**", "/api/lodgings/view/**",
							    "/api/rooms/view/**", "/api/event/view/**", "/error", "/api/auth/register", "/api/auth/login",
								"/api/auth/logout", "/api/auth/refresh", "/api/auth/google", "/api/auth/kakao",
								"/api/auth/naver")
						.permitAll()
						// 그 외 요청은 인증된 사용자만 접근 가능.
						.anyRequest().authenticated())
				// security 기본 로그인 필터보다 먼저 JWT 필터를 실행시킨다.
				.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

		return http.build();
	}

	@Bean
	PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}
}
