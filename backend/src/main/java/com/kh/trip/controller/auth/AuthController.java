package com.kh.trip.controller.auth;

import java.util.Map;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kh.trip.dto.auth.ChangePasswordRequestDTO;
import com.kh.trip.dto.auth.LoginRequestDTO;
import com.kh.trip.dto.auth.LoginResponseDTO;
import com.kh.trip.dto.auth.LogoutRequestDTO;
import com.kh.trip.dto.auth.RefreshTokenRequestDTO;
import com.kh.trip.dto.auth.RegisterRequestDTO;
import com.kh.trip.dto.auth.TokenRefreshResponseDTO;
import com.kh.trip.dto.auth.social.GoogleLoginRequestDTO;
import com.kh.trip.dto.auth.social.KakaoLoginRequestDTO;
import com.kh.trip.dto.auth.social.NaverLoginRequestDTO;
import com.kh.trip.security.AuthUserPrincipal;
import com.kh.trip.service.auth.AuthService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
	// 인증 관련 비즈니스 로직은 service에게 맡긴다.
	private final AuthService authService;

	@PostMapping("/register")
	public Map<String, String> register(@Valid @RequestBody RegisterRequestDTO request) {

		// 회원가입 요청 데이터를 service로 넘긴다.
		authService.register(request);

		// 회원가입 성공 메시지를 응답한다.
		return Map.of("msg", "register success");
	}

	@PatchMapping("/password")
	public Map<String, String> changePassword(@AuthenticationPrincipal AuthUserPrincipal authUser,
			@Valid @RequestBody ChangePasswordRequestDTO request) {
		authService.changePassword(authUser.getUserNo(), request);
		return Map.of("result", "SUCCESS");
	}

	@PostMapping("/login")
	public LoginResponseDTO login(@Valid @RequestBody LoginRequestDTO request) {
		// loginId, password를 service로 넘겨 로그인 처리한다.
		// 성공하면 access token, refresh token 등을 응답한다.
		return authService.login(request);
	}

	@PostMapping("/logout")
	public Map<String, String> logout(@Valid @RequestBody LogoutRequestDTO request) {
		authService.logout(request);
		return Map.of("msg", "logout success");
	}

	@PostMapping("/refresh")
	public TokenRefreshResponseDTO refresh(@Valid @RequestBody RefreshTokenRequestDTO request) {
		// refresh token을 service로 넘겨 새 access token 발급을 요청한다.
		return authService.refresh(request);
	}

	@PostMapping("/google")
	public LoginResponseDTO googleLogin(@Valid @RequestBody GoogleLoginRequestDTO request) {
		return authService.googleLogin(request);
	}

	@PostMapping("/kakao")
	public LoginResponseDTO kakaoLogin(@Valid @RequestBody KakaoLoginRequestDTO request) {
		return authService.kakaoLogin(request);
	}

	@PostMapping("/naver")
	public LoginResponseDTO naverLogin(@Valid @RequestBody NaverLoginRequestDTO request) {
		return authService.naverLogin(request);
	}

}
