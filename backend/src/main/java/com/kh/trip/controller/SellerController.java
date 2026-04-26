package com.kh.trip.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.kh.trip.dto.BookingDTO;
import com.kh.trip.dto.HostProfileDTO;
import com.kh.trip.dto.LodgingDTO;
import com.kh.trip.dto.PageRequestDTO;
import com.kh.trip.dto.PageResponseDTO;
import com.kh.trip.dto.SellerDashboardLodgingSummaryDTO;
import com.kh.trip.dto.SellerSalesSummaryDTO;
import com.kh.trip.security.AuthUserPrincipal;
import com.kh.trip.service.BookingService;
import com.kh.trip.service.HostProfileService;
import com.kh.trip.service.LodgingService;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@RestController
@RequiredArgsConstructor
@Log4j2
@RequestMapping("/api/seller")
public class SellerController {

	private final BookingService bookingService;
	private final HostProfileService hostProfileService;
	private final LodgingService lodgingService;

	@GetMapping("/lodgings")
	@PreAuthorize("hasRole('HOST')")
	public List<LodgingDTO> getMyLodgings(@AuthenticationPrincipal AuthUserPrincipal authUser) {
		HostProfileDTO hostProfile = requireHostProfile(authUser);
		return lodgingService.getLodgingsByHostNo(hostProfile.getHostNo());
	}

	@GetMapping("/lodgings/summary")
	@PreAuthorize("hasRole('HOST')")
	public List<SellerDashboardLodgingSummaryDTO> getMyLodgingSummaries(
			@AuthenticationPrincipal AuthUserPrincipal authUser) {
		HostProfileDTO hostProfile = requireHostProfile(authUser);
		return lodgingService.getSellerDashboardLodgingSummaries(hostProfile.getHostNo());
	}

	@GetMapping("/bookings")
	@PreAuthorize("hasRole('HOST')")
	public PageResponseDTO<BookingDTO> findMine(PageRequestDTO pageRequestDTO,
			@AuthenticationPrincipal AuthUserPrincipal authUser) {
		HostProfileDTO hostProfile = requireHostProfile(authUser);
		return bookingService.findByHostNo(hostProfile.getHostNo(), pageRequestDTO);
	}

	@GetMapping("/hostlist/{hostNo}")
	@PreAuthorize("hasRole('HOST')")
	public PageResponseDTO<BookingDTO> findByHostNo(@PathVariable Long hostNo, PageRequestDTO pageRequestDTO,
			@AuthenticationPrincipal AuthUserPrincipal authUser) {
		HostProfileDTO hostProfile = requireHostProfile(authUser);
		if (!hostProfile.getHostNo().equals(hostNo)) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "본인 예약 목록만 조회할 수 있습니다.");
		}
		log.info("findByHostNo() hostNo= " + hostNo);
		return bookingService.findByHostNo(hostNo, pageRequestDTO);
	}

	@PatchMapping("/bookings/{bookingNo}/status")
	@PreAuthorize("hasRole('HOST')")
	public BookingDTO updateBookingStatus(@PathVariable Long bookingNo, @RequestBody Map<String, String> payload,
			@AuthenticationPrincipal AuthUserPrincipal authUser) {
		HostProfileDTO hostProfile = requireHostProfile(authUser);
		log.info("updateBookingStatus() bookingNo= {}", bookingNo);
		return bookingService.updateStatus(bookingNo, hostProfile.getHostNo(), payload.get("status"));
	}

	private HostProfileDTO requireHostProfile(AuthUserPrincipal authUser) {
		HostProfileDTO hostProfile = hostProfileService.getByUserNo(authUser.getUserNo());
		if (hostProfile == null) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "판매자 정보를 찾을 수 없습니다.");
		}
		return hostProfile;
	}

	@GetMapping("/sales-summary")
	@PreAuthorize("hasRole('HOST')")
	public SellerSalesSummaryDTO getSalesSummary(@AuthenticationPrincipal AuthUserPrincipal authUser) {
		HostProfileDTO hostProfile = requireHostProfile(authUser);
		return bookingService.getSellerSalesSummary(hostProfile.getHostNo());
	}

	public String getMethodName(@RequestParam String param) {
		return new String();
	}

}
