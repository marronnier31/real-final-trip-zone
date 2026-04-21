package com.kh.trip.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.kh.trip.domain.LodgingImage;

//숙소 이미지 Repository
public interface LodgingImageRepository extends JpaRepository<LodgingImage, Long> {
	
	// 특정 숙소 번호의 이미지들을 정렬 순서 오름차순으로 조회
	List<LodgingImage> findByLodging_LodgingNoOrderBySortOrderAsc(Long lodgingNo);

}
