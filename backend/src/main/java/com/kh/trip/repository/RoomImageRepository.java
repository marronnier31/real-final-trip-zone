package com.kh.trip.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.kh.trip.domain.RoomImage;

public interface RoomImageRepository extends JpaRepository<RoomImage, Long>{

	// 특정 객실 번호의 이미지들을 정렬 순서대로 조회
	List<RoomImage> findByRoom_RoomNoOrderBySortOrderAsc(Long roomNo);

	// 특정 객실 번호의 이미지 전체 삭제
	void deleteByRoom_RoomNo(Long roomNo);

}
