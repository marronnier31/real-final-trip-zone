package com.kh.trip.service;

import com.kh.trip.dto.MypageDTO;
import com.kh.trip.dto.PageRequestDTO;
import com.kh.trip.dto.PageResponseDTO;

public interface MypageService {

	MypageDTO.HomeResponse getHome(Long userNo);

	MypageDTO.ProfileResponse getProfile(Long userNo);

	MypageDTO.BookingResponse getBookings(Long userNo);

	MypageDTO.CouponResponse getCoupons(Long userNo);

	MypageDTO.MileageResponse getMileage(Long userNo);

	PageResponseDTO<MypageDTO.MileageItem> getMileageHistory(Long userNo, PageRequestDTO pageRequestDTO);

	MypageDTO.PaymentResponse getPayments(Long userNo);

	MypageDTO.WishlistResponse getWishlist(Long userNo);

	MypageDTO.InquiryResponse getInquiries(Long userNo);

	MypageDTO.InquiryDetailResponse getInquiryDetail(Long userNo, Long inquiryNo);
}
