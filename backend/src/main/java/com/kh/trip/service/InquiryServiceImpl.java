package com.kh.trip.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.kh.trip.domain.Inquiry;
import com.kh.trip.domain.User;
import com.kh.trip.domain.enums.InquiryStatus;
import com.kh.trip.dto.InquiryDTO;
import com.kh.trip.dto.PageRequestDTO;
import com.kh.trip.dto.PageResponseDTO;
import com.kh.trip.repository.InquiryRepository;
import com.kh.trip.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class InquiryServiceImpl implements InquiryService{
	private final InquiryRepository repository;
	private final UserRepository userRepository;
	
	@Override
	public Long save(InquiryDTO inquiryDTO) {
		Inquiry inquiry = dtoToEntity(inquiryDTO);
		return repository.save(inquiry).getInquiryNo();
	}

	@Override
	public PageResponseDTO<InquiryDTO> findAll(PageRequestDTO pageRequestDTO) {
		Pageable pageable = PageRequest.of(pageRequestDTO.getPage() - 1, pageRequestDTO.getSize(),
				Sort.by("inquiryNo").descending());
		Page<Inquiry> result = repository.findAll(pageable);
		List<InquiryDTO> dtoList = entityToDTO(result);
		return PageResponseDTO.<InquiryDTO>withAll().dtoList(dtoList).pageRequestDTO(pageRequestDTO)
				.totalCount(result.getTotalElements()).build();
	}

	@Override
	public PageResponseDTO<InquiryDTO> findByUserId(Long userNo,PageRequestDTO pageRequestDTO) {
		Pageable pageable = PageRequest.of(pageRequestDTO.getPage() - 1, pageRequestDTO.getSize(),
				Sort.by("inquiryNo").descending());
		User user = userRepository.findById(userNo).orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원 정보입니다."));
		Page<Inquiry> result = repository.findByUserId(userNo, pageable, InquiryStatus.DELETE);
		List<InquiryDTO> dtoList = entityToDTO(result);
		return PageResponseDTO.<InquiryDTO>withAll().dtoList(dtoList).pageRequestDTO(pageRequestDTO)
				.totalCount(result.getTotalElements()).build();
	}
	
	@Override
	public void update(Long inquiryNo, InquiryDTO inquiryDTO) {
		Inquiry inquiry = repository.findById(inquiryNo).orElseThrow(() -> new IllegalArgumentException("존재하지 않는 문의 정보입니다."));
		inquiry.changeTitle(inquiryDTO.getTitle());
		inquiry.changeInquiryType(inquiryDTO.getInquiryType());
		inquiry.changeContent(inquiryDTO.getContent());
		inquiry.changeRelatedBookingNo(normalizeText(inquiryDTO.getBookingNo()));
		inquiry.changeRelatedLodgingName(normalizeText(inquiryDTO.getLodging()));
		repository.save(inquiry);
	}
	
	@Override
	public void delete(Long inquiryNo) {
		Inquiry inquiry = repository.findById(inquiryNo).orElseThrow(() -> new IllegalArgumentException("존재하지 않는 문의 정보입니다."));
		inquiry.changeStatus(InquiryStatus.DELETE);
		repository.save(inquiry);
	}

	@Override
	public InquiryDTO findById(Long inquiryNo) {
		Inquiry inquiry = repository.findById(inquiryNo).orElseThrow(() -> new IllegalArgumentException("존재하지 않는 문의 정보입니다."));
		return entityToDTO(inquiry);
	}

	@Override
	public InquiryDTO updateStatus(Long inquiryNo, InquiryStatus status) {
		Inquiry inquiry = repository.findById(inquiryNo)
				.orElseThrow(() -> new IllegalArgumentException("존재하지 않는 문의 정보입니다."));
		inquiry.changeStatus(status);
		return entityToDTO(repository.save(inquiry));
	}

	public Inquiry dtoToEntity(InquiryDTO inquiryDTO) {
		User user = userRepository.findById(inquiryDTO.getUserNo())
				.orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원 번호입니다."));
		
		return Inquiry.builder().user(user).inquiryType(inquiryDTO.getInquiryType()).title(inquiryDTO.getTitle())
				.content(inquiryDTO.getContent()).status(InquiryStatus.PENDING)
				.relatedBookingNo(normalizeText(inquiryDTO.getBookingNo()))
				.relatedLodgingName(normalizeText(inquiryDTO.getLodging()))
				.build();
	}
	
	private List<InquiryDTO> entityToDTO(Page<Inquiry> result) {
		return result.stream().map(inquiry -> InquiryDTO.builder().inquiryNo(inquiry.getInquiryNo())
				.userNo(inquiry.getUser().getUserNo()).inquiryType(inquiry.getInquiryType())
				.title(inquiry.getTitle()).content(inquiry.getContent()).status(inquiry.getStatus())
				.bookingNo(inquiry.getRelatedBookingNo()).lodging(inquiry.getRelatedLodgingName())
				.regDate(inquiry.getRegDate()).updDate(inquiry.getUpdDate()).build()).collect(Collectors.toList());
	}

	private InquiryDTO entityToDTO(Inquiry inquiry) {
		return InquiryDTO.builder().inquiryNo(inquiry.getInquiryNo())
				.userNo(inquiry.getUser().getUserNo()).inquiryType(inquiry.getInquiryType())
				.title(inquiry.getTitle()).content(inquiry.getContent()).status(inquiry.getStatus())
				.bookingNo(inquiry.getRelatedBookingNo()).lodging(inquiry.getRelatedLodgingName())
				.regDate(inquiry.getRegDate()).updDate(inquiry.getUpdDate()).build();
	}

	private String normalizeText(String value) {
		if (value == null) {
			return null;
		}

		String trimmed = value.trim();
		return trimmed.isEmpty() ? null : trimmed;
	}
}
