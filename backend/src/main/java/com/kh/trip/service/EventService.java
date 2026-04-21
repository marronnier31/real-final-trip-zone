package com.kh.trip.service;

import org.springframework.transaction.annotation.Transactional;

import com.kh.trip.dto.EventDTO;
import com.kh.trip.dto.PageRequestDTO;
import com.kh.trip.dto.PageResponseDTO;

@Transactional
public interface EventService {
	// 가로로보이는 리스트
	PageResponseDTO<EventDTO> findAll(PageRequestDTO pageRequestDTO);

	// save
	Long save(EventDTO eventDTO);

	// update
	void update(EventDTO eventDTO);

	// delete
	void delete(Long eventNo);

	// findById
	EventDTO findById(Long eventNo);

}
