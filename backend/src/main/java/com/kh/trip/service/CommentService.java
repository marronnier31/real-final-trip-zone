package com.kh.trip.service;

import com.kh.trip.dto.CommentDTO;
import com.kh.trip.dto.PageRequestDTO;
import com.kh.trip.dto.PageResponseDTO;

import jakarta.transaction.Transactional;

@Transactional
public interface CommentService {
	//findAll
	PageResponseDTO<CommentDTO> findAll(PageRequestDTO pageRequestDTO);
	//save
	Long save(CommentDTO commentDTO);
	//update
	void update(CommentDTO commentDTO);
	//delete
	void delete(Long commentNo);

}
