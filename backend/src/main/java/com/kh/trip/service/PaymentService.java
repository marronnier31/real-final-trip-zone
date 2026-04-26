package com.kh.trip.service;

import com.kh.trip.dto.PageRequestDTO;
import com.kh.trip.dto.PageResponseDTO;
import com.kh.trip.dto.PaymentDTO;

public interface PaymentService {

	Long save(PaymentDTO paymentDTO, Long userNo);

	PageResponseDTO<PaymentDTO> getPaymentsByBooking(Long bookingNo, Long userNo, PageRequestDTO pageRequestDTO);

	PageResponseDTO<PaymentDTO> findByUserId(Long userNo, PageRequestDTO pageRequestDTO);

	PaymentDTO getPaymentById(Long paymentNo, Long userNo);

	void complete(Long paymentNo);

	void cancel(Long paymentNo, Long userNo);

}
