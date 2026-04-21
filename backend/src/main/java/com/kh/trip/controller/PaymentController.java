package com.kh.trip.controller;

import java.util.Map;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kh.trip.dto.PageRequestDTO;
import com.kh.trip.dto.PageResponseDTO;
import com.kh.trip.dto.PaymentDTO;
import com.kh.trip.security.AuthUserPrincipal;
import com.kh.trip.service.PaymentService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

	private final PaymentService paymentService;

	@PostMapping
	@PreAuthorize("hasRole('USER')")
	public Map<String, Long> save(@AuthenticationPrincipal AuthUserPrincipal authUser,
			@Valid @RequestBody PaymentDTO paymentDTO) {
		Long paymentNo = paymentService.save(paymentDTO, authUser.getUserNo());
		return Map.of("result", paymentNo);
	}

	@GetMapping("/booking/{bookingNo}")
	@PreAuthorize("hasRole('USER')")
	public PageResponseDTO<PaymentDTO> getPaymentsByBooking(@AuthenticationPrincipal AuthUserPrincipal authUser,
			@PathVariable Long bookingNo, PageRequestDTO pageRequestDTO) {
		return paymentService.getPaymentsByBooking(bookingNo, authUser.getUserNo(), pageRequestDTO);
	}

	@GetMapping("/{paymentNo}")
	@PreAuthorize("hasRole('USER')")
	public PaymentDTO getPaymentById(@AuthenticationPrincipal AuthUserPrincipal authUser,
			@PathVariable Long paymentNo) {
		return paymentService.getPaymentById(paymentNo, authUser.getUserNo());
	}

	@PutMapping("/{paymentNo}/complete")
	@PreAuthorize("hasRole('ADMIN')")
	public Map<String, String> complete(@PathVariable Long paymentNo) {
		paymentService.complete(paymentNo);
		return Map.of("result", "SUCCESS");
	}

	@PutMapping("/{paymentNo}/cancel")
	@PreAuthorize("hasRole('USER')")
	public Map<String, String> cancel(@AuthenticationPrincipal AuthUserPrincipal authUser,
			@PathVariable Long paymentNo) {
		paymentService.cancel(paymentNo, authUser.getUserNo());
		return Map.of("result", "SUCCESS");
	}
}
