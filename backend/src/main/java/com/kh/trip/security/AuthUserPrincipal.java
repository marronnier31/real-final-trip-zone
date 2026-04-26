package com.kh.trip.security;

import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AuthUserPrincipal implements UserDetails {
	
	private static final long serialVersionUID = 1L;

	private Long userNo;
	private String loginId;
	private String password;
	private String userName;
	private String email;
	private String phone;
	private String enabled;
	private List<String> roleNames;

	public String getUserName() {
	    return userName;
	}
	// JWT 생성 시 사용할 사용자 정보를 claims 형태로 반환한다.
	public Map<String, Object> getClaims() {
		Map<String, Object> claims = new HashMap<>();
		claims.put("userNo", userNo);
		claims.put("loginId", loginId);
		claims.put("userName", userName);
		claims.put("email", email);
		claims.put("roleNames", roleNames);
		return claims;
	}

	@Override
	public Collection<? extends GrantedAuthority> getAuthorities() {
		// 권한 문자열을 시큐리티 권한 객체로 변환한다.
		return roleNames.stream().map(SimpleGrantedAuthority::new).toList();
	}

	@Override
	public String getPassword() {
		// 시큐리티가 비밀번호 비교에 사용할 값이다.
		return password;
	}

	@Override
	public String getUsername() {
		// 로그인 식별자로 loginId를 사용한다.
		return loginId;
	}

	@Override
	public boolean isAccountNonExpired() {
		return true;
	}

	@Override
	public boolean isAccountNonLocked() {
		return true;
	}

	@Override
	public boolean isCredentialsNonExpired() {
		return true;
	}

	@Override
	public boolean isEnabled() {
		// USERS.ENABLED 값이 1인 경우만 활성 사용자로 본다.
		return "1".equals(enabled);
	}
}
