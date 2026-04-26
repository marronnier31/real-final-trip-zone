package com.kh.trip.service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.kh.trip.domain.Comment;
import com.kh.trip.domain.Inquiry;
import com.kh.trip.domain.User;
import com.kh.trip.domain.enums.InquiryStatus;
import com.kh.trip.domain.enums.InquiryType;
import com.kh.trip.dto.InquiryDTO;
import com.kh.trip.dto.InquiryMessageDTO;
import com.kh.trip.dto.PageRequestDTO;
import com.kh.trip.dto.PageResponseDTO;
import com.kh.trip.repository.CommentRepository;
import com.kh.trip.repository.InquiryRepository;
import com.kh.trip.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class InquiryServiceImpl implements InquiryService {
    private static final DateTimeFormatter DATE_TIME_FORMAT = DateTimeFormatter.ofPattern("yyyy.MM.dd HH:mm");

    private final InquiryRepository repository;
    private final CommentRepository commentRepository;
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
    public PageResponseDTO<InquiryDTO> findByUserId(Long userNo, PageRequestDTO pageRequestDTO) {
        Pageable pageable = PageRequest.of(pageRequestDTO.getPage() - 1, pageRequestDTO.getSize(),
                Sort.by("inquiryNo").descending());
        userRepository.findById(userNo)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        Page<Inquiry> result = repository.findByUserId(userNo, pageable, InquiryStatus.DELETE);
        List<InquiryDTO> dtoList = entityToDTO(result);
        return PageResponseDTO.<InquiryDTO>withAll().dtoList(dtoList).pageRequestDTO(pageRequestDTO)
                .totalCount(result.getTotalElements()).build();
    }

    @Override
    public void update(Long inquiryNo, InquiryDTO inquiryDTO) {
        Inquiry inquiry = repository.findById(inquiryNo)
                .orElseThrow(() -> new IllegalArgumentException("문의를 찾을 수 없습니다."));
        inquiry.changeTitle(inquiryDTO.getTitle());
        inquiry.changeInquiryType(inquiryDTO.getInquiryType());
        inquiry.changeContent(inquiryDTO.getContent());
        inquiry.changeRelatedBookingNo(normalizeText(inquiryDTO.getBookingNo()));
        inquiry.changeRelatedLodgingName(normalizeText(inquiryDTO.getLodging()));
        repository.save(inquiry);
    }

    @Override
    public void delete(Long inquiryNo) {
        Inquiry inquiry = repository.findById(inquiryNo)
                .orElseThrow(() -> new IllegalArgumentException("문의를 찾을 수 없습니다."));
        inquiry.changeStatus(InquiryStatus.DELETE);
        repository.save(inquiry);
    }

    @Override
    public InquiryDTO findById(Long inquiryNo) {
        Inquiry inquiry = repository.findById(inquiryNo)
                .orElseThrow(() -> new IllegalArgumentException("문의를 찾을 수 없습니다."));
        return entityToDTO(inquiry);
    }

    @Override
    public InquiryDTO updateStatus(Long inquiryNo, InquiryStatus status) {
        Inquiry inquiry = repository.findById(inquiryNo)
                .orElseThrow(() -> new IllegalArgumentException("문의를 찾을 수 없습니다."));
        inquiry.changeStatus(status);
        return entityToDTO(repository.save(inquiry));
    }

    @Override
    public InquiryDTO getMyInquiryDetail(Long userNo, Long inquiryNo) {
        Inquiry inquiry = repository.findById(inquiryNo)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "문의를 찾을 수 없습니다."));

        if (!inquiry.getUser().getUserNo().equals(userNo)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "다른 사용자의 문의를 조회할 수 없습니다.");
        }

        List<Comment> comments = commentRepository.findByInquiry_InquiryNoOrderByRegDateAsc(inquiryNo);
        return entityToDetailDTO(inquiry, comments);
    }

    public Inquiry dtoToEntity(InquiryDTO inquiryDTO) {
        User user = userRepository.findById(inquiryDTO.getUserNo())
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        return Inquiry.builder()
                .user(user)
                .inquiryType(inquiryDTO.getInquiryType())
                .title(inquiryDTO.getTitle())
                .content(inquiryDTO.getContent())
                .status(InquiryStatus.PENDING)
                .relatedBookingNo(normalizeText(inquiryDTO.getBookingNo()))
                .relatedLodgingName(normalizeText(inquiryDTO.getLodging()))
                .build();
    }

    private List<InquiryDTO> entityToDTO(Page<Inquiry> result) {
        return result.stream().map(this::entityToDTO).collect(Collectors.toList());
    }

    private InquiryDTO entityToDTO(Inquiry inquiry) {
        return InquiryDTO.builder()
                .inquiryNo(inquiry.getInquiryNo())
                .userNo(inquiry.getUser().getUserNo())
                .inquiryType(inquiry.getInquiryType())
                .title(inquiry.getTitle())
                .content(inquiry.getContent())
                .status(inquiry.getStatus())
                .bookingNo(inquiry.getRelatedBookingNo())
                .lodging(inquiry.getRelatedLodgingName())
                .regDate(inquiry.getRegDate())
                .updDate(inquiry.getUpdDate())
                .type(toInquiryType(inquiry.getInquiryType()))
                .statusLabel(toInquiryStatus(inquiry.getStatus()))
                .actor("사용자")
                .updatedAt(formatDateTime(inquiry.getUpdDate() != null ? inquiry.getUpdDate() : inquiry.getRegDate()))
                .preview(inquiry.getContent())
                .build();
    }

    private InquiryDTO entityToDetailDTO(Inquiry inquiry, List<Comment> comments) {
        return InquiryDTO.builder()
                .inquiryNo(inquiry.getInquiryNo())
                .userNo(inquiry.getUser().getUserNo())
                .inquiryType(inquiry.getInquiryType())
                .title(inquiry.getTitle())
                .content(inquiry.getContent())
                .status(inquiry.getStatus())
                .bookingNo(inquiry.getRelatedBookingNo())
                .lodging(inquiry.getRelatedLodgingName())
                .regDate(inquiry.getRegDate())
                .updDate(inquiry.getUpdDate())
                .type(toInquiryType(inquiry.getInquiryType()))
                .statusLabel(toInquiryStatus(inquiry.getStatus()))
                .actor("사용자")
                .updatedAt(formatDateTime(inquiry.getUpdDate() != null ? inquiry.getUpdDate() : inquiry.getRegDate()))
                .preview(inquiry.getContent())
                .messages(buildInquiryMessages(inquiry, comments))
                .build();
    }

    private List<InquiryMessageDTO> buildInquiryMessages(Inquiry inquiry, List<Comment> comments) {
        List<InquiryMessageDTO> messages = new ArrayList<>();
        messages.add(InquiryMessageDTO.builder()
                .senderName("사용자")
                .content(inquiry.getContent())
                .regDate(inquiry.getRegDate())
                .build());

        messages.addAll(comments.stream()
                .map(comment -> InquiryMessageDTO.builder()
                        .messageNo(comment.getCommentNo())
                        .senderName("관리자")
                        .content(comment.getContent())
                        .regDate(comment.getRegDate())
                        .build())
                .toList());

        return messages;
    }

    private String normalizeText(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String toInquiryType(InquiryType type) {
        return type != null ? type.name() : null;
    }

    private String toInquiryStatus(InquiryStatus status) {
        if (status == null) {
            return null;
        }
        return switch (status) {
        case PENDING -> "OPEN";
        case COMPLETED -> "ANSWERED";
        case DELETE -> "CLOSED";
        };
    }

    private String formatDateTime(LocalDateTime value) {
        return value != null ? DATE_TIME_FORMAT.format(value) : null;
    }
}
