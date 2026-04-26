package com.kh.trip.service;

import java.util.List;

import com.kh.trip.dto.LodgingDTO;
import com.kh.trip.dto.PageRequestDTO;
import com.kh.trip.dto.PageResponseDTO;
import com.kh.trip.dto.SellerDashboardLodgingSummaryDTO;

public interface LodgingService {

	// 숙소 등록,페이징처리
	LodgingDTO createLodging(LodgingDTO lodgingDTO);
	PageResponseDTO<LodgingDTO> getAllLodgings(PageRequestDTO pageRequestDTO);

	// 숙소 단건 조회
	LodgingDTO getLodging(Long lodgingNo);

	// 숙소 전체 목록 조회
	List<LodgingDTO> getAllLodgings();

	// 판매자 본인 숙소 목록 조회
	List<LodgingDTO> getLodgingsByHostNo(Long hostNo);

	List<SellerDashboardLodgingSummaryDTO> getSellerDashboardLodgingSummaries(Long hostNo);

	// 지역으로 숙소 목록 조회
	List<LodgingDTO> getLodgingsByRegion(String region);

	// 숙소명 키워드 검색
	List<LodgingDTO> searchLodgingsByName(String keyword);

	// 숙소 수정
	LodgingDTO updateLodging(Long lodgingNo, LodgingDTO lodgingDTO);
	
	// 숙소 삭제
	void deleteLodging(Long lodgingNo);
	
	//숙소 상세조회 
	LodgingDTO getLodgingDetail(Long lodgingNo);
		

}
