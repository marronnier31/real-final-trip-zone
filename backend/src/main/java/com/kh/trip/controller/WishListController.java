package com.kh.trip.controller;

import java.util.Map;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kh.trip.dto.PageRequestDTO;
import com.kh.trip.dto.PageResponseDTO;
import com.kh.trip.dto.WishListDTO;
import com.kh.trip.security.AuthUserPrincipal;
import com.kh.trip.service.WishListService;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@Log4j2
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/wishList")
public class WishListController {

	private final WishListService service;

	// 리스트
	@GetMapping("/list")
	@PreAuthorize("hasRole('USER')")
	public PageResponseDTO<WishListDTO> findAll(@AuthenticationPrincipal AuthUserPrincipal authUser,
			PageRequestDTO pageRequestDTO) {
		log.info(pageRequestDTO);
		return service.findAll(authUser.getUserNo(), pageRequestDTO);
	}

	// 찜 저장
	@PostMapping
	@PreAuthorize("hasRole('USER')")
	public Map<String, Long> save(@AuthenticationPrincipal AuthUserPrincipal authUser,
			@RequestBody WishListDTO wishListDTO) {
		wishListDTO.setUserNo(authUser.getUserNo());
		log.info("WishListDTO" + wishListDTO);
		Long wishListNo = service.save(authUser.getUserNo(), wishListDTO);
		return Map.of("wishListNo", wishListNo);
	}

	// 찜 삭제
	@DeleteMapping("/{wishListNo}")
	@PreAuthorize("hasRole('USER')")
	public Map<String, String> delete(@AuthenticationPrincipal AuthUserPrincipal authUser,
			@PathVariable Long wishListNo) {
		log.info("Delete:" + wishListNo);
		service.delete(wishListNo, authUser.getUserNo());
		return Map.of("RESULT", "SUCCESS");
	}
}
