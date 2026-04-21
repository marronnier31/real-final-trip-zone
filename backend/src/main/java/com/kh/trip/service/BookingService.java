package com.kh.trip.service;

import com.kh.trip.dto.BookingDTO;
import com.kh.trip.dto.PageRequestDTO;
import com.kh.trip.dto.PageResponseDTO;
import com.kh.trip.dto.SellerSalesSummaryDTO;

public interface BookingService {

	Long save(BookingDTO bookingDTO);

	BookingDTO findById(Long bookingNo);

	PageResponseDTO<BookingDTO> findByUserId(Long userNo, PageRequestDTO pageRequestDTO);

	PageResponseDTO<BookingDTO> findByHostNo(Long hostNo, PageRequestDTO pageRequestDTO);

	BookingDTO updateStatus(Long bookingNo, String status);

	BookingDTO updateStatus(Long bookingNo, Long hostNo, String status);

	void cancelBooking(Long bookingNo);

	void complete(Long bookingNo);

	SellerSalesSummaryDTO getSellerSalesSummary(Long hostNo);

}
