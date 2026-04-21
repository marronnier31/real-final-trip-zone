package com.kh.trip.controller;

import java.util.List;
import java.util.Map;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kh.trip.dto.CouponDTO;
import com.kh.trip.service.CouponService;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@RestController
@RequiredArgsConstructor
@Log4j2
@RequestMapping("/api/coupon")
public class CouponController {

	private final CouponService service;

	@PostMapping
	public Map<String, Long> save(@RequestBody CouponDTO couponDTO) {
		log.info("couponSave() = " + couponDTO);
		Long couponNo = service.save(couponDTO);
		return Map.of("couponNo", couponNo);
	}

	@GetMapping("/list")
	@PreAuthorize("hasAnyRole('ADMIN','USER')")
	public List<CouponDTO> findAll() {
		log.info("CouponDTOFindAll()");
		return service.findAll();
	}

	@PatchMapping("/{couponNo}")
	@PreAuthorize("hasRole('ADMIN')")
	public Map<String, String> update(@PathVariable Long couponNo, @RequestBody CouponDTO couponDTO) {
		log.info("update() couponNo= " + couponNo);
		couponDTO.setCouponNo(couponNo);
		service.update(couponDTO);
		return Map.of("result", "SUCCESS");
	}

	@DeleteMapping("/{couponNo}")
	@PreAuthorize("hasRole('ADMIN')")
	public Map<String, String> delete(@PathVariable Long couponNo) {
		log.info("delete() couponNo = " + couponNo);
		service.delete(couponNo);
		return Map.of("result", "SUCCESS");
	}
}
