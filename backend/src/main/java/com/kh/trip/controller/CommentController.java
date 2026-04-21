package com.kh.trip.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kh.trip.dto.CommentDTO;
import com.kh.trip.dto.PageRequestDTO;
import com.kh.trip.dto.PageResponseDTO;
import com.kh.trip.service.CommentService;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@Log4j2
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/comment")
public class CommentController {

	private final CommentService service;

	// 댓글리스트
	@GetMapping("/list")
	public PageResponseDTO<CommentDTO> findAll(PageRequestDTO pageRequestDTO) {
		log.info(pageRequestDTO);
		return service.findAll(pageRequestDTO);
	}

	// 댓글저장
	@PostMapping
	public Map<String, Object> save(@RequestBody CommentDTO commentDTO) {
		log.info("CommentDTO" + commentDTO);
		Long commentNo = service.save(commentDTO);
		Map<String, Object> result = new HashMap<>();
		result.put("commentNo", commentNo);
		return result;
	}

	// 댓글수정
	@PutMapping("/{commentNo}")
	public Map<String, String> update(@PathVariable Long commentNo, @RequestBody CommentDTO commentDTO) {
		commentDTO.setCommentNo(commentNo);
		log.info("Update:" + commentDTO);
		service.update(commentDTO);
		return Map.of("RESULT", "SUCCESS");
	}

	// 댓글삭제
	@DeleteMapping("/{commentNo}")
	public Map<String, String> delete(@PathVariable Long commentNo) {
		log.info("Delete:" + commentNo);
		service.delete(commentNo);
		return Map.of("RESULT", "SUCCESS");
	}
}
