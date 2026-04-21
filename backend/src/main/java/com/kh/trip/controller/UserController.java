package com.kh.trip.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.kh.trip.dto.UserDTO;
import com.kh.trip.dto.UserUpdateRequestDTO;
import com.kh.trip.security.AuthUserPrincipal;
import com.kh.trip.service.UserService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

	private final UserService userService;

	@GetMapping("/me") // 로그인된 사용자 정보 가져오는거
	@PreAuthorize("hasRole('USER')")
	public UserDTO getMyInfo(@AuthenticationPrincipal AuthUserPrincipal principal) {
		AuthUserPrincipal authUser = requirePrincipal(principal);

		return userService.getUser(authUser.getUserNo());
	}

	private AuthUserPrincipal requirePrincipal(AuthUserPrincipal principal) {
		if (principal == null) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인 후 이용 가능합니다.");
		}
		return principal;
	}

	// 회원 정보 수정
	@PatchMapping("/{userNo}/update")
	@PreAuthorize("hasRole('USER')")
	public Map<String, String> update(@PathVariable Long userNo, @RequestBody UserUpdateRequestDTO request,
			@AuthenticationPrincipal AuthUserPrincipal authUser) {
		if (!authUser.getUserNo().equals(userNo)) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "본인 정보만 수정할 수 있습니다.");
		}
		userService.update(userNo, request);
		return Map.of("result", "SUCCESS");
	}

	// 회원 탈퇴
	@PatchMapping("/{userNo}/delete")
	@PreAuthorize("hasRole('USER')")
	public Map<String, String> delete(@PathVariable Long userNo, @AuthenticationPrincipal AuthUserPrincipal authUser) {

		if (!authUser.getUserNo().equals(userNo)) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "본인 계정만 탈퇴할 수 있습니다.");
		}
		userService.delete(userNo);
		return Map.of("result", "SUCCESS");
	}

}
