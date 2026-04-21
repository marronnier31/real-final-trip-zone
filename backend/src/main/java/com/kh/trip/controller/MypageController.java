package com.kh.trip.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.kh.trip.dto.HostProfileDTO;
import com.kh.trip.dto.MypageDTO;
import com.kh.trip.dto.PageRequestDTO;
import com.kh.trip.dto.PageResponseDTO;
import com.kh.trip.security.AuthUserPrincipal;
import com.kh.trip.service.HostProfileService;
import com.kh.trip.service.MypageService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/mypage")
@RequiredArgsConstructor
public class MypageController {

	private final MypageService mypageService;
	private final HostProfileService hostProfileService;

	@GetMapping("/home")
	@PreAuthorize("hasRole('USER')")
	public MypageDTO.HomeResponse getHome(@AuthenticationPrincipal AuthUserPrincipal principal) {
		return mypageService.getHome(requirePrincipal(principal).getUserNo());
	}

	@GetMapping("/host-profile")
	@PreAuthorize("hasAnyRole('USER', 'HOST')")
	public ResponseEntity<HostProfileDTO> getMyHostProfile(@AuthenticationPrincipal AuthUserPrincipal principal) {
		HostProfileDTO hostProfile = hostProfileService.getByUserNo(requirePrincipal(principal).getUserNo());
		if (hostProfile == null) {
			return ResponseEntity.noContent().build();
		}
		return ResponseEntity.ok(hostProfile);
	}

	@GetMapping("/bookings")
	@PreAuthorize("hasRole('USER')")
	public MypageDTO.BookingResponse getBookings(@AuthenticationPrincipal AuthUserPrincipal principal) {
		return mypageService.getBookings(requirePrincipal(principal).getUserNo());
	}

	@GetMapping("/profile")
	@PreAuthorize("hasRole('USER')")
	public MypageDTO.ProfileResponse getProfile(@AuthenticationPrincipal AuthUserPrincipal principal) {
		return mypageService.getProfile(requirePrincipal(principal).getUserNo());
	}

	@GetMapping("/coupons")
	@PreAuthorize("hasRole('USER')")
	public MypageDTO.CouponResponse getCoupons(@AuthenticationPrincipal AuthUserPrincipal principal) {
		return mypageService.getCoupons(requirePrincipal(principal).getUserNo());
	}

	@GetMapping("/mileage")
	@PreAuthorize("hasRole('USER')")
	public MypageDTO.MileageResponse getMileage(@AuthenticationPrincipal AuthUserPrincipal principal) {
		return mypageService.getMileage(requirePrincipal(principal).getUserNo());
	}

	@GetMapping("/mileage-history")
	@PreAuthorize("hasRole('USER')")
	public PageResponseDTO<MypageDTO.MileageItem> getMileageHistory(
			@AuthenticationPrincipal AuthUserPrincipal principal, PageRequestDTO pageRequestDTO) {
		return mypageService.getMileageHistory(requirePrincipal(principal).getUserNo(), pageRequestDTO);
	}

	@GetMapping("/payments")
	@PreAuthorize("hasRole('USER')")
	public MypageDTO.PaymentResponse getPayments(@AuthenticationPrincipal AuthUserPrincipal principal) {
		return mypageService.getPayments(requirePrincipal(principal).getUserNo());
	}

	@GetMapping("/wishlist")
	@PreAuthorize("hasRole('USER')")
	public MypageDTO.WishlistResponse getWishlist(@AuthenticationPrincipal AuthUserPrincipal principal) {
		return mypageService.getWishlist(requirePrincipal(principal).getUserNo());
	}

	@GetMapping("/inquiries")
	@PreAuthorize("hasRole('USER')")
	public MypageDTO.InquiryResponse getInquiries(@AuthenticationPrincipal AuthUserPrincipal principal) {
		return mypageService.getInquiries(requirePrincipal(principal).getUserNo());
	}

	@GetMapping("/inquiries/{inquiryNo}")
	public MypageDTO.InquiryDetailResponse getInquiryDetail(@AuthenticationPrincipal AuthUserPrincipal principal,
			@PathVariable Long inquiryNo) {
		return mypageService.getInquiryDetail(requirePrincipal(principal).getUserNo(), inquiryNo);
	}

	private AuthUserPrincipal requirePrincipal(AuthUserPrincipal principal) {
		if (principal == null) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인 후 이용 가능합니다.");
		}
		return principal;
	}
}
