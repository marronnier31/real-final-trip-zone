package com.kh.trip.service.auth;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.kh.trip.domain.MemberGrade;
import com.kh.trip.domain.User;
import com.kh.trip.domain.UserAuthProvider;
import com.kh.trip.domain.UserRefreshToken;
import com.kh.trip.domain.UserRole;
import com.kh.trip.domain.enums.MemberGradeName;
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
import com.kh.trip.repository.MemberGradeRepository;
import com.kh.trip.repository.UserAuthProviderRepository;
import com.kh.trip.repository.UserRefreshTokenRepository;
import com.kh.trip.repository.UserRepository;
import com.kh.trip.repository.UserRoleRepository;
import com.kh.trip.security.AuthUserPrincipal;
import com.kh.trip.security.CustomUserDetailsService;
import com.kh.trip.security.JwtProvider;
import com.kh.trip.security.social.GoogleTokenVerifier;
import com.kh.trip.security.social.KakaoTokenVerifier;
import com.kh.trip.security.social.NaverTokenVerifier;
import com.kh.trip.security.social.SocialUserInfo;
import com.kh.trip.service.HostRoleSyncService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

	// 회원 기본정보를 저장하는 repository
	private final UserRepository userRepository;
	
	// 회원에게 부여할 등급정보를 불러오는 repository
	private final MemberGradeRepository memberGradeRepository;

	// 로그인 정보(loginId, passwordHash)를 저장하는 repository
	private final UserAuthProviderRepository userAuthProviderRepository;

	// 회원 권한 정보를 저장하는 repository
	private final UserRoleRepository userRoleRepository;

	// loginId로 사용자 인증 정보를 조회하는 서비스
	private final CustomUserDetailsService customUserDetailsService;

	// 비밀번호 암호화 / 비밀번호 비교를 위한 객체
	private final PasswordEncoder passwordEncoder;

	// access token, refresh token 생성과 검증을 담당하는 객체
	private final JwtProvider jwtProvider;

	// refresh token을 DB에 저장/조회하는 repository
	private final UserRefreshTokenRepository userRefreshTokenRepository;

	private final GoogleTokenVerifier googleTokenVerifier;

	private final KakaoTokenVerifier kakaoTokenVerifier;

	private final NaverTokenVerifier naverTokenVerifier;

	private final HostRoleSyncService hostRoleSyncService;
	
	// refresh token 만료 시간(초)
	@Value("${jwt.refresh-token-expiration}")
	private long refreshTokenExpiration;

	// access token 만료 시간(초)
	@Value("${jwt.access-token-expiration}")
	private long accessTokenExpiration;

	@Override
	@Transactional
	public void register(RegisterRequestDTO request) {

		// 이미 사용 중인 loginId면 회원가입 불가
		if (userAuthProviderRepository.existsByLoginId(request.getLoginId())) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 사용 중인 아이디입니다.");
		}

		// 이미 사용 중인 email이면 회원가입 불가
		if (userRepository.existsByEmail(request.getEmail())) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 사용 중인 이메일입니다.");
		}

		//신규 회원에게 부여할 기본 등급(BASIC) 조회
		MemberGrade basicGrade = memberGradeRepository.findById(MemberGradeName.BASIC)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "기본 등급 설정이 없습니다."));
		
		// USERS 테이블에 저장할 회원 기본정보 생성
		User user = User.builder().userName(request.getUserName()).email(request.getEmail()).phone(request.getPhone()).memberGrade(basicGrade)
				.enabled("1").build();

		// 회원 기본정보 저장
		User savedUser = userRepository.save(user);

		// USER_AUTH_PROVIDERS 테이블에 저장할 로그인 정보 생성
		// 비밀번호는 평문이 아니라 암호화해서 저장한다.
		UserAuthProvider authProvider = UserAuthProvider.builder().userNo(savedUser.getUserNo()).providerCode("LOCAL")
				.loginId(request.getLoginId()).passwordHash(passwordEncoder.encode(request.getPassword())).build();

		// 로그인 정보 저장
		userAuthProviderRepository.save(authProvider);

		// USER_ROLES 테이블에 기본 권한 ROLE_USER 저장
		UserRole userRole = UserRole.builder().userNo(savedUser.getUserNo()).roleCode("ROLE_USER").build();

		userRoleRepository.save(userRole);
	}

	@Override
	public LoginResponseDTO login(LoginRequestDTO request) {

		// 사용자가 입력한 loginId로 인증 정보를 조회한다.
		AuthUserPrincipal authUser;

		try {
			// 입력한 loginId로 사용자 인증 정보를 조회한다.
			authUser = (AuthUserPrincipal) customUserDetailsService.loadUserByUsername(request.getLoginId());
		} catch (UsernameNotFoundException e) {
			throw new BadCredentialsException("아이디 또는 비밀번호가 올바르지 않습니다.");
		}
		// 탈퇴/비활성 회원은 로그인 차단
		if (!authUser.isEnabled()) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "탈퇴한 회원은 로그인할 수 없습니다.");
		}
		// 사용자가 입력한 비밀번호와 DB의 암호화 비밀번호를 비교
		if (!passwordEncoder.matches(request.getPassword(), authUser.getPassword())) {
			throw new BadCredentialsException("아이디 또는 비밀번호가 올바르지 않습니다.");
		}

		// 로그인 성공 시 access token 과 refresh token 을 생성한다.
		String accessToken = jwtProvider.generateAccessToken(authUser);
		String refreshToken = jwtProvider.generateRefreshToken(authUser);

		// refresh token 을 DB에 저장하기 위한 객체 생성
		UserRefreshToken userRefreshToken = UserRefreshToken.builder().userNo(authUser.getUserNo())
				.tokenValue(refreshToken).expiresAt(LocalDateTime.now().plusSeconds(refreshTokenExpiration)).build();

		// Refresh Token 을 DB에 저장해서 서버가 토큰 상태를 직접 통제할 수 있게 한다.
		userRefreshTokenRepository.save(userRefreshToken);

		// 프론트엔드가 이후 요청에 사용할 토큰과 사용자 정보를 응답한다.
		return LoginResponseDTO.builder().grantType("Bearer").accessToken(accessToken).refreshToken(refreshToken)
				.accessTokenExpiresIn(accessTokenExpiration).refreshTokenExpiresIn(refreshTokenExpiration)
				.userNo(authUser.getUserNo()).loginId(authUser.getLoginId()).userName(authUser.getUserName())
				.roleNames(authUser.getRoleNames()).build();
	}

	@Override
	public TokenRefreshResponseDTO refresh(RefreshTokenRequestDTO request) {

		String refreshToken = request.getRefreshToken();

		// 1. Refresh Token 자체의 서명/만료가 유효한지 먼저 검사
		if (!jwtProvider.validateToken(refreshToken)) {
			throw new RuntimeException("Invalid refresh token");
		}

		// 2. DB에 저장된 Refresh Token인지 다시 확인
		UserRefreshToken savedToken = userRefreshTokenRepository.findByTokenValue(refreshToken)
				.orElseThrow(() -> new RuntimeException("Refresh token not found"));
		// 3. 이미 로그아웃 등으로 폐기된 토큰인지 확인
		if ("1".equals(savedToken.getRevokedYn())) {
			throw new RuntimeException("Refresh token revoked");
		}
		// 4. DB 기준 만료 시간도 다시 확인
		if (savedToken.getExpiresAt().isBefore(LocalDateTime.now())) {
			throw new RuntimeException("Refresh token expired");
		}

		// 5. 토큰 안의 userNo를 꺼내 현재 사용자 정보를 다시 조회
		Long userNo = jwtProvider.getUserNo(refreshToken);
		AuthUserPrincipal authUser = customUserDetailsService.loadUserByUserNo(userNo);
		
		// 6. 사용자가 비활성화 상태라면 재발급도 막고 Refresh Token도 폐기
		if (!authUser.isEnabled()) {
			savedToken.revoke();
			userRefreshTokenRepository.save(savedToken);
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "탈퇴한 회원은 토큰을 재발급할 수 없습니다.");
		}
		
		// 7. 새 Access Token만 재발급
		String newAccessToken = jwtProvider.generateAccessToken(authUser);

		return TokenRefreshResponseDTO.builder().grantType("Bearer").accessToken(newAccessToken)
				.accessTokenExpiresIn(accessTokenExpiration).build();
	}

	@Override
	public void logout(LogoutRequestDTO request) {
		// 1. 요청에서 Refresh Token 추출
		String refreshToken = request.getRefreshToken();
		
		// 2. 토큰 자체가 유효한지 먼저 확인
		if (!jwtProvider.validateToken(refreshToken)) {
			throw new RuntimeException("Invalid refresh token");
		}
		// 3. DB에 저장된 Refresh Token인지 조회
		UserRefreshToken savedToken = userRefreshTokenRepository.findByTokenValue(refreshToken)
				.orElseThrow(() -> new RuntimeException("Refresh token not found"));
		// 4. 토큰의 주인(userNo)이 실제 DB 기록과 일치하는지 확인
		if (!savedToken.getUserNo().equals(jwtProvider.getUserNo(refreshToken))) {
			throw new RuntimeException("Refresh token owner mismatch");
		}
		// 5. 이미 폐기된 토큰이면 중복 로그아웃으로 간주
		if ("1".equals(savedToken.getRevokedYn())) {
			throw new RuntimeException("Refresh token already revoked");
		}
		// 6. Refresh Token 폐기 처리
		savedToken.revoke();

		// 7. 폐기 상태 저장
		userRefreshTokenRepository.save(savedToken);
	}

	
	// 소셜 로그인 공통 처리 메서드
	private LoginResponseDTO socialLogin(SocialUserInfo socialUser) {

		// 1. providerCode + providerUserId로 이미 연동된 계정인지 확인
		Optional<UserAuthProvider> authProviderOpt = userAuthProviderRepository
				.findByProviderCodeAndProviderUserId(socialUser.getProviderCode(), socialUser.getProviderUserId());

		Long userNo;

		if (authProviderOpt.isPresent()) {
			// 이미 소셜 연동된 계정이면 기존 userNo 사용
			userNo = authProviderOpt.get().getUserNo();
		} else {
			// 아직 소셜 연동이 안 된 경우, 같은 이메일 회원이 있는지 확인
			Optional<User> existingUserOpt = userRepository.findByEmail(socialUser.getEmail());

			if (existingUserOpt.isPresent()) {
				// 같은 이메일 회원이 있으면 해당 회원에 소셜 계정만 추가 연동
				User existingUser = existingUserOpt.get();

				UserAuthProvider authProvider = UserAuthProvider.builder()
						.userNo(existingUser.getUserNo())
						.providerCode(socialUser.getProviderCode())
						.providerUserId(socialUser.getProviderUserId())
						.build();

				userAuthProviderRepository.save(authProvider);
				userNo = existingUser.getUserNo();
			} else {
				// 완전히 신규 사용자면 USER, USER_AUTH_PROVIDER, USER_ROLE을 모두 생성
				MemberGrade basicGrade = memberGradeRepository.findById(MemberGradeName.BASIC)
						.orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "기본 등급 설정이 없습니다."));

				User newUser = User.builder()
						.userName(socialUser.getUserName())
						.email(socialUser.getEmail())
						.phone("SOCIAL")
						.memberGrade(basicGrade)
						.enabled("1")
						.build();
				User savedUser = userRepository.save(newUser);

				UserAuthProvider authProvider = UserAuthProvider.builder()
						.userNo(savedUser.getUserNo())
						.providerCode(socialUser.getProviderCode())
						.providerUserId(socialUser.getProviderUserId())
						.build();

				userAuthProviderRepository.save(authProvider);

				UserRole userRole = UserRole.builder().userNo(savedUser.getUserNo()).roleCode("ROLE_USER").build();
				userRoleRepository.save(userRole);

				userNo = savedUser.getUserNo();
			}
		}
		// 2. 최종 사용자 정보를 조회하고 활성 여부 확인
		User user = userRepository.findById(userNo).orElseThrow(() -> new RuntimeException("User not found"));
		if (!"1".equals(user.getEnabled())) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "탈퇴한 회원은 로그인할 수 없습니다.");
		}
		// 3. 현재 사용자 권한 목록 조회
		List<String> roleNames = hostRoleSyncService.syncAndGetRoleNames(userNo);

		// 4. JWT 생성을 위한 Spring Security 사용자 객체 생성
		AuthUserPrincipal authUser = new AuthUserPrincipal(user.getUserNo(), user.getEmail(), "", user.getUserName(),
				user.getEmail(), user.getPhone(), user.getEnabled(), roleNames);

		// 5. 일반 로그인과 동일하게 Access / Refresh Token 발급
		String accessToken = jwtProvider.generateAccessToken(authUser);
		String refreshToken = jwtProvider.generateRefreshToken(authUser);

		// 6. Refresh Token 저장
		UserRefreshToken userRefreshToken = UserRefreshToken.builder().userNo(authUser.getUserNo())
				.tokenValue(refreshToken).expiresAt(LocalDateTime.now().plusSeconds(refreshTokenExpiration)).build();

		userRefreshTokenRepository.save(userRefreshToken);

		// 7. 토큰과 사용자 정보를 응답
		return LoginResponseDTO.builder().grantType("Bearer").accessToken(accessToken).refreshToken(refreshToken)
				.accessTokenExpiresIn(accessTokenExpiration).refreshTokenExpiresIn(refreshTokenExpiration)
				.userNo(authUser.getUserNo()).loginId(authUser.getLoginId()).userName(authUser.getUserName())
				.roleNames(authUser.getRoleNames()).build();
	}

	@Override
	@Transactional
	public LoginResponseDTO googleLogin(GoogleLoginRequestDTO request) {
		// Google에서 받은 idToken을 검증해서 사용자 정보를 추출
		SocialUserInfo socialUser = googleTokenVerifier.verify(request.getIdToken());
		// 이후 흐름은 공통 소셜 로그인 로직으로 처리
		return socialLogin(socialUser);
	}

	@Override
	@Transactional
	public LoginResponseDTO kakaoLogin(KakaoLoginRequestDTO request) {
		// Kakao 인가 코드를 검증해서 사용자 정보를 추출
		SocialUserInfo socialUser = kakaoTokenVerifier.verify(request.getCode(), request.getRedirectUri());
		return socialLogin(socialUser);
	}

	@Override
	@Transactional
	public LoginResponseDTO naverLogin(NaverLoginRequestDTO request) {
		// Naver 인가 코드/상태값을 검증해서 사용자 정보를 추출
		SocialUserInfo socialUser = naverTokenVerifier.verify(request.getCode(), request.getState());
		return socialLogin(socialUser);
	}

	@Override
	@Transactional
	public void changePassword(Long userNo, ChangePasswordRequestDTO request) {
		
		// 1. LOCAL 계정 사용자만 비밀번호 변경 가능
		UserAuthProvider authProvider = userAuthProviderRepository.findByUserNoAndProviderCode(userNo, "LOCAL")
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, "로컬 로그인 계정만 비밀번호를 변경할 수 있습니다."));
		// 2. 새 비밀번호와 확인 비밀번호가 일치하는지 검사
		if (!request.getNewPassword().equals(request.getNewPasswordConfirm())) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "새 비밀번호와 비밀번호 확인이 일치하지 않습니다.");
		}
		// 3. 새 비밀번호를 암호화해서 저장
		authProvider.changePasswordHash(passwordEncoder.encode(request.getNewPassword()));
		userAuthProviderRepository.save(authProvider);
	}
}
