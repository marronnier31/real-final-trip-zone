package com.kh.trip.controller;

import java.util.Map;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import com.kh.trip.dto.InquiryDTO;
import com.kh.trip.dto.PageRequestDTO;
import com.kh.trip.dto.PageResponseDTO;
import com.kh.trip.security.AuthUserPrincipal;
import com.kh.trip.service.InquiryService;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@RestController
@RequiredArgsConstructor
@Log4j2
@RequestMapping("/api/inquiry")
public class InquiryController {
	private final InquiryService service;

	@PostMapping
	public Map<String, Long> save(@AuthenticationPrincipal AuthUserPrincipal authUser, @RequestBody InquiryDTO inquiryDTO) {
		log.info("inquiry:save()" + inquiryDTO);
		if (authUser == null) {
			throw new IllegalArgumentException("로그인이 필요합니다.");
		}
		inquiryDTO.setUserNo(authUser.getUserNo());
		Long inquiryNo = service.save(inquiryDTO);
		return Map.of("result", inquiryNo);
	}

	@GetMapping("/list")
	public PageResponseDTO<InquiryDTO> findAll(PageRequestDTO pageRequestDTO) {
		log.info("inquiry:findByAll()");
		return service.findAll(pageRequestDTO);
	}

	@GetMapping("/list/{userNo}")
	public PageResponseDTO<InquiryDTO> findByUserId(@PathVariable Long userNo, PageRequestDTO pageRequestDTO) {
		log.info("inquiry:findByUserId(userNo) = " + userNo);
		return service.findByUserId(userNo, pageRequestDTO);
	}

	@GetMapping("/{inquiryNo}")
	public InquiryDTO findById(@PathVariable Long inquiryNo) {
		log.info("inquiry:findById(inquiryNo) = " + inquiryNo);
		return service.findById(inquiryNo);
	}

	@PatchMapping("/{inquiryNo}")
	public void update(@PathVariable Long inquiryNo, @RequestBody InquiryDTO inquiryDTO) {
		log.info("inquiry:update(inquiryNo) = " + inquiryNo);
		service.update(inquiryNo, inquiryDTO);
	}

	@DeleteMapping("/{inquiryNo}")
	public void delete(@PathVariable Long inquiryNo) {
		log.info("inquiry:delete(inquiryNo) = " + inquiryNo);
		service.delete(inquiryNo);
	}

}
