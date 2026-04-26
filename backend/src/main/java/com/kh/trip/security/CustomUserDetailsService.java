package com.kh.trip.security;

import java.util.List;
import java.util.Optional;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.kh.trip.domain.User;
import com.kh.trip.domain.UserAuthProvider;
import com.kh.trip.repository.UserAuthProviderRepository;
import com.kh.trip.repository.UserRepository;
import com.kh.trip.service.HostRoleSyncService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

	private final UserAuthProviderRepository userAuthProviderRepository;
	private final UserRepository userRepository;
	private final HostRoleSyncService hostRoleSyncService;

	@Override
	public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {

		// 일반 로그인용: loginId 또는 email -> LOCAL 계정 조회
		Optional<UserAuthProvider> authProviderOpt = userAuthProviderRepository.findByLoginId(username);

		if (authProviderOpt.isEmpty()) {
			User userByEmail = userRepository.findByEmail(username)
					.orElseThrow(() -> new UsernameNotFoundException("LoginId Or Email Not Found"));

			authProviderOpt = userAuthProviderRepository.findByUserNoAndProviderCode(userByEmail.getUserNo(), "LOCAL");
		}

		UserAuthProvider authProvider = authProviderOpt
				.orElseThrow(() -> new UsernameNotFoundException("Local Auth Provider Not Found"));

		User user = userRepository.findById(authProvider.getUserNo())
				.orElseThrow(() -> new UsernameNotFoundException("User Not Found"));

		List<String> roleNames = hostRoleSyncService.syncAndGetRoleNames(user.getUserNo());

		return new AuthUserPrincipal(user.getUserNo(), authProvider.getLoginId(), authProvider.getPasswordHash(),
				user.getUserName(), user.getEmail(), user.getPhone(), user.getEnabled(), roleNames);
	}

	public AuthUserPrincipal loadUserByUserNo(Long userNo) {

		User user = userRepository.findById(userNo).orElseThrow(() -> new UsernameNotFoundException("User Not Found"));

		List<String> roleNames = hostRoleSyncService.syncAndGetRoleNames(userNo);

		// JWT 재인증용: loginId가 없을 수도 있으니 있으면 쓰고, 없으면 email 사용
		Optional<UserAuthProvider> authProviderOpt = userAuthProviderRepository.findByUserNo(userNo).stream()
				.findFirst();

		String loginId = authProviderOpt.map(UserAuthProvider::getLoginId)
				.filter(value -> value != null && !value.isBlank()).orElse(user.getEmail());

		String passwordHash = authProviderOpt.map(UserAuthProvider::getPasswordHash).orElse("");

		return new AuthUserPrincipal(user.getUserNo(), loginId, passwordHash, user.getUserName(), user.getEmail(),
				user.getPhone(), user.getEnabled(), roleNames);
	}

}
