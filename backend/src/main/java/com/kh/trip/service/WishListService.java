package com.kh.trip.service;

import com.kh.trip.dto.PageRequestDTO;
import com.kh.trip.dto.PageResponseDTO;
import com.kh.trip.dto.WishListDTO;

public interface WishListService {
	//findAll(list)
	PageResponseDTO<WishListDTO> findAll(Long userNo, PageRequestDTO pageRequestDTO);
	//save
	Long save(Long userNo, WishListDTO dto);
	//delete
	void delete(Long wishListNo, Long userNo);

}
