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

import com.kh.trip.dto.AdminStaticDTO;
import com.kh.trip.dto.AdminUserSearchRequestDTO;
import com.kh.trip.dto.HostProfileDTO;
import com.kh.trip.dto.InquiryDTO;
import com.kh.trip.dto.PageResponseDTO;
import com.kh.trip.dto.UserDTO;
import com.kh.trip.domain.enums.InquiryStatus;
import com.kh.trip.security.AuthUserPrincipal;
import com.kh.trip.service.AdminStaticService;
import com.kh.trip.service.HostProfileService;
import com.kh.trip.service.InquiryService;
import com.kh.trip.service.UserService;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@RestController
@Log4j2
@RequiredArgsConstructor
@RequestMapping("/api/admin")
public class AdminController {

	private final UserService userService;
	private final HostProfileService hostProfileService;
	private final InquiryService inquiryService;
	private final AdminStaticService adminStaticService;
	
	// 관리자 회원 목록 조회
	@GetMapping("/admin/userlist")
	@PreAuthorize("hasRole('ADMIN')")
	public PageResponseDTO<UserDTO> findUsers(AdminUserSearchRequestDTO request) {
		// 검색조건/페이징 DTO를 서비스로 전달해 회원 목록을 조회한다.
		return userService.findUsers(request);
	}

	// 관리자 회원 상세조회
	@GetMapping("/admin/{userNo}/detail")
	@PreAuthorize("hasRole('ADMIN')")
	public UserDTO getUserDetail(@PathVariable Long userNo) {
		return userService.getUser(userNo);
	}

	@PatchMapping("/users/{userNo}/status")
	@PreAuthorize("hasRole('ADMIN')")
	public UserDTO updateUserStatus(@PathVariable Long userNo, @RequestBody Map<String, String> payload) {
		String status = payload.get("status");

		if ("ACTIVE".equals(status)) {
			userService.restore(userNo);
		} else if ("BLOCKED".equals(status)) {
			userService.delete(userNo);
		} else {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "지원하지 않는 회원 상태입니다.");
		}

		return userService.getUser(userNo);
	}

	// 관리자 호스트승인
	@PatchMapping("/{hostNo}/approve")
	@PreAuthorize("hasRole('ADMIN')")
	public Map<String, String> approve(@PathVariable Long hostNo, @AuthenticationPrincipal AuthUserPrincipal authUser) {
		hostProfileService.approve(hostNo, authUser.getUserNo());
		return Map.of("result", "SUCCESS");
	}

	//관리자 호스트 승인거절
	@PatchMapping("/{hostNo}/reject")
	@PreAuthorize("hasRole('ADMIN')")
	public Map<String, String> reject(@PathVariable Long hostNo, @RequestBody HostProfileDTO hostProfileDTO,
			@AuthenticationPrincipal AuthUserPrincipal authUser) {
		hostProfileService.reject(hostNo, authUser.getUserNo(), hostProfileDTO.getRejectReason());
		return Map.of("result", "SUCCESS");
	}

	@PatchMapping("/inquiries/{inquiryNo}/status")
	@PreAuthorize("hasRole('ADMIN')")
	public InquiryDTO updateInquiryStatus(@PathVariable Long inquiryNo, @RequestBody Map<String, String> payload) {
		String status = payload.get("status");
		InquiryStatus nextStatus = switch (status) {
		case "ANSWERED" -> InquiryStatus.COMPLETED;
		case "CLOSED" -> InquiryStatus.DELETE;
		default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "지원하지 않는 문의 상태입니다.");
		};

		return inquiryService.updateStatus(inquiryNo, nextStatus);
	}
	
	@GetMapping("/")
	@PreAuthorize("hasRole('ADMIN')")
	public AdminStaticDTO adminStatic() {
		return adminStaticService.adminStatic();
	}
}
