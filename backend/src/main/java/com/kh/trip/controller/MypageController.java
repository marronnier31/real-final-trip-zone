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

import com.kh.trip.dto.BookingDTO;
import com.kh.trip.dto.CodeLabelValueDTO;
import com.kh.trip.dto.HostProfileDTO;
import com.kh.trip.dto.InquiryDTO;
import com.kh.trip.dto.PageRequestDTO;
import com.kh.trip.dto.PageResponseDTO;
import com.kh.trip.dto.PaymentDTO;
import com.kh.trip.dto.UserCouponDTO;
import com.kh.trip.dto.UserDTO;
import com.kh.trip.dto.WishListDTO;
import com.kh.trip.security.AuthUserPrincipal;
import com.kh.trip.service.BookingService;
import com.kh.trip.service.HostProfileService;
import com.kh.trip.service.InquiryService;
import com.kh.trip.service.MypageService;
import com.kh.trip.service.PaymentService;
import com.kh.trip.service.UserCouponService;
import com.kh.trip.service.WishListService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/mypage")
@RequiredArgsConstructor
public class MypageController {

    private final HostProfileService hostProfileService;
    private final MypageService mypageService;
    private final BookingService bookingService;
    private final UserCouponService userCouponService;
    private final InquiryService inquiryService;
    private final PaymentService paymentService;
    private final WishListService wishListService;

    @GetMapping("/host-profile")
    @PreAuthorize("hasAnyRole('USER', 'HOST')")
    public ResponseEntity<HostProfileDTO> getMyHostProfile(@AuthenticationPrincipal AuthUserPrincipal principal) {
        HostProfileDTO hostProfile = hostProfileService.getByUserNo(requirePrincipal(principal).getUserNo());
        if (hostProfile == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(hostProfile);
    }

    @GetMapping("/profile")
    @PreAuthorize("hasRole('USER')")
    public UserDTO getProfile(@AuthenticationPrincipal AuthUserPrincipal principal) {
        return mypageService.getProfile(requirePrincipal(principal).getUserNo());
    }

    @GetMapping("/bookings")
    @PreAuthorize("hasRole('USER')")
    public PageResponseDTO<BookingDTO> getBookings(
            @AuthenticationPrincipal AuthUserPrincipal principal,
            PageRequestDTO pageRequestDTO) {
        return bookingService.findByUserId(requirePrincipal(principal).getUserNo(), pageRequestDTO);
    }

    @GetMapping("/coupons")
    @PreAuthorize("hasRole('USER')")
    public PageResponseDTO<UserCouponDTO> getCoupons(
            @AuthenticationPrincipal AuthUserPrincipal principal,
            PageRequestDTO pageRequestDTO) {
        return userCouponService.findAll(requirePrincipal(principal).getUserNo(), pageRequestDTO);
    }

    @GetMapping("/mileage")
    @PreAuthorize("hasRole('USER')")
    public CodeLabelValueDTO getMileage(@AuthenticationPrincipal AuthUserPrincipal principal) {
        return mypageService.getMileage(requirePrincipal(principal).getUserNo());
    }

    @GetMapping("/mileage-history")
    @PreAuthorize("hasRole('USER')")
    public PageResponseDTO<CodeLabelValueDTO> getMileageHistory(
            @AuthenticationPrincipal AuthUserPrincipal principal,
            PageRequestDTO pageRequestDTO) {
        return mypageService.getMileageHistory(requirePrincipal(principal).getUserNo(), pageRequestDTO);
    }

    @GetMapping("/payments")
    @PreAuthorize("hasRole('USER')")
    public PageResponseDTO<PaymentDTO> getPayments(
            @AuthenticationPrincipal AuthUserPrincipal principal,
            PageRequestDTO pageRequestDTO) {
        return paymentService.findByUserId(requirePrincipal(principal).getUserNo(), pageRequestDTO);
    }

    @GetMapping("/wishlist")
    @PreAuthorize("hasRole('USER')")
    public PageResponseDTO<WishListDTO> getWishlist(
            @AuthenticationPrincipal AuthUserPrincipal principal,
            PageRequestDTO pageRequestDTO) {
        return wishListService.findAll(requirePrincipal(principal).getUserNo(), pageRequestDTO);
    }

    @GetMapping("/inquiries")
    @PreAuthorize("hasRole('USER')")
    public PageResponseDTO<InquiryDTO> getInquiries(
            @AuthenticationPrincipal AuthUserPrincipal principal,
            PageRequestDTO pageRequestDTO) {
        return inquiryService.findByUserId(requirePrincipal(principal).getUserNo(), pageRequestDTO);
    }

    @GetMapping("/inquiries/{inquiryNo}")
    @PreAuthorize("hasRole('USER')")
    public InquiryDTO getInquiryDetail(
            @AuthenticationPrincipal AuthUserPrincipal principal,
            @PathVariable Long inquiryNo) {
        return inquiryService.getMyInquiryDetail(requirePrincipal(principal).getUserNo(), inquiryNo);
    }

    private AuthUserPrincipal requirePrincipal(AuthUserPrincipal principal) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        return principal;
    }
}
