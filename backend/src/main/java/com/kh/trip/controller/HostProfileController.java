package com.kh.trip.controller;

import java.util.Map;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kh.trip.dto.HostProfileDTO;
import com.kh.trip.dto.PageRequestDTO;
import com.kh.trip.dto.PageResponseDTO;
import com.kh.trip.security.AuthUserPrincipal;
import com.kh.trip.service.HostProfileService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/hosts")
public class HostProfileController {

	private final HostProfileService hostProfileService;

	@PostMapping("/register")
	@PreAuthorize("hasRole('USER')")
	public Long register(@AuthenticationPrincipal AuthUserPrincipal authUser,
			@RequestBody HostProfileDTO hostProfileDTO) {
		hostProfileDTO.setUserNo(authUser.getUserNo());
		return hostProfileService.register(hostProfileDTO);
	}

	@GetMapping
	@PreAuthorize("hasRole('ADMIN')")
	public PageResponseDTO<HostProfileDTO> getList(PageRequestDTO pageRequestDTO) {
		return hostProfileService.getList(pageRequestDTO);
	}

	@GetMapping("/{hostNo}")
	@PreAuthorize("hasRole('ADMIN')")
	public HostProfileDTO get(@PathVariable Long hostNo) {
		return hostProfileService.get(hostNo);
	}

	@PatchMapping("/{hostNo}")
	@PreAuthorize("hasRole('USER')")
	public Map<String, String> update(@PathVariable Long hostNo, @AuthenticationPrincipal AuthUserPrincipal authUser,
			@RequestBody HostProfileDTO hostProfileDTO) {
		hostProfileService.update(hostNo, authUser.getUserNo(), hostProfileDTO);
		return Map.of("result", "SUCCESS");
	}

	@PutMapping("/{hostNo}/delete")
	@PreAuthorize("hasRole('ADMIN')")
	public Map<String, String> delete(@PathVariable Long hostNo) {
		hostProfileService.delete(hostNo);
		return Map.of("result", "SUCCESS");
	}

	@PutMapping("/{hostNo}/restore")
	@PreAuthorize("hasRole('ADMIN')")
	public Map<String, String> restore(@PathVariable Long hostNo) {
		hostProfileService.restore(hostNo);
		return Map.of("result", "SUCCESS");
	}

}
