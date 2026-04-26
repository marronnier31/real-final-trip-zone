package com.kh.trip.service;

import com.kh.trip.dto.InquiryDTO;
import com.kh.trip.dto.PageRequestDTO;
import com.kh.trip.dto.PageResponseDTO;
import com.kh.trip.domain.enums.InquiryStatus;

public interface InquiryService {

	Long save(InquiryDTO inquiryDTO);

	PageResponseDTO<InquiryDTO> findAll(PageRequestDTO pageRequestDTO);

	PageResponseDTO<InquiryDTO> findByUserId(Long userNo, PageRequestDTO pageRequestDTO);

	void update(Long inquiryNo, InquiryDTO inquiryDTO);

	void delete(Long inquiryNo);

	InquiryDTO findById(Long inquiryNo);

	InquiryDTO updateStatus(Long inquiryNo, InquiryStatus status);

	InquiryDTO getMyInquiryDetail(Long userNo, Long inquiryNo);

	
}
