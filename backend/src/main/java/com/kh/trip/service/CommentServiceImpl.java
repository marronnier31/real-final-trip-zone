package com.kh.trip.service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import com.kh.trip.domain.Comment;
import com.kh.trip.domain.Inquiry;
import com.kh.trip.domain.User;
import com.kh.trip.dto.CommentDTO;
import com.kh.trip.dto.PageRequestDTO;
import com.kh.trip.dto.PageResponseDTO;
import com.kh.trip.repository.CommentRepository;
import com.kh.trip.repository.InquiryRepository;
import com.kh.trip.repository.UserRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Transactional
@Service
@Slf4j
@RequiredArgsConstructor
public class CommentServiceImpl implements CommentService {

	private final CommentRepository commentRepository;
	private final UserRepository userRepository;
	private final InquiryRepository inquiryRepository;

	// findAll
	@Override
	public PageResponseDTO<CommentDTO> findAll(PageRequestDTO pageRequestDTO) {

		Pageable pageable = PageRequest.of(pageRequestDTO.getPage() - 1, pageRequestDTO.getSize(),
				Sort.by("commentNo").descending());

		Page<Comment> result = commentRepository.findAll(pageable);

		List<CommentDTO> dtoList = result.getContent().stream().map(comment -> {
			return CommentDTO.builder().commentNo(comment.getCommentNo()).userNo(comment.getUser().getUserNo())
					.inquiryNo(comment.getInquiry().getInquiryNo()).content(comment.getContent()).build();
		}).collect(Collectors.toList());

		Long totalCount = result.getTotalElements();

		return PageResponseDTO.<CommentDTO>withAll().dtoList(dtoList) // 위에서 만든 dtoList를 담아줍니다
				.totalCount(totalCount).pageRequestDTO(pageRequestDTO).build();
	}

	// save
	@Override
	public Long save(CommentDTO commentDTO) {
		log.info(".............");
		User user = userRepository.findById(commentDTO.getUserNo())
				.orElseThrow(() -> new IllegalArgumentException("존재하지 않는 유저입니다."));
		Inquiry inquiry = inquiryRepository.findById(commentDTO.getInquiryNo())
				.orElseThrow(() -> new IllegalArgumentException("존재하지 않는 문의입니다."));
		Comment comment = Comment.builder().user(user).inquiry(inquiry).content(commentDTO.getContent()).build();
		Comment result = commentRepository.save(comment);
		return result.getCommentNo();
	}

	// update
	@Override
	public void update(CommentDTO commentDTO) {
		Optional<Comment> result = commentRepository.findById(commentDTO.getCommentNo());
		Comment comment = result.orElseThrow(() -> new RuntimeException("해당 댓글없음:" + commentDTO.getCommentNo()));

		comment.changeContent(commentDTO.getContent());
		log.info("DB 새로운 업데이트 번호" + commentDTO.getCommentNo());
		commentRepository.save(comment);
	}

	// delete
	@Override
	public void delete(Long commentNo) {
		Optional<Comment> result = commentRepository.findById(commentNo);
		Comment comment = result.orElseThrow(() -> new RuntimeException("해당 댓글 없음" + commentNo));
		commentRepository.delete(comment);
		log.info("댓글 완전 삭제 완료" + commentNo);
	}

}
