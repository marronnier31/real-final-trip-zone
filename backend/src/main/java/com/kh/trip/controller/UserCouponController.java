package com.kh.trip.controller;

import java.util.Map;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kh.trip.dto.PageRequestDTO;
import com.kh.trip.dto.PageResponseDTO;
import com.kh.trip.dto.UserCouponDTO;
import com.kh.trip.security.AuthUserPrincipal;
import com.kh.trip.service.UserCouponService;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@Log4j2
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/usercoupon")
public class UserCouponController {

	private final UserCouponService service;

	@PostMapping
	@PreAuthorize("hasRole('USER')")
	public Map<String, Long> save(@AuthenticationPrincipal AuthUserPrincipal authUser,
			@RequestBody UserCouponDTO userCouponDTO) {
		log.info("save() userCouponDTO = " + userCouponDTO);
		Long userCouponNo = service.save(authUser.getUserNo(), userCouponDTO);
		return Map.of("userCouponNo", userCouponNo);
	}

	@GetMapping("/list")
	@PreAuthorize("hasRole('USER')")
	public PageResponseDTO<UserCouponDTO> findAll(@AuthenticationPrincipal AuthUserPrincipal authUser,
			PageRequestDTO pageRequestDTO) {
		return service.findAll(authUser.getUserNo(), pageRequestDTO);
	}
}
