package com.kh.trip.service;

import java.util.List;

import com.kh.trip.domain.enums.RoomStatus;
import com.kh.trip.dto.RoomDTO;

public interface RoomService {

	// 객실 등록 기능
	RoomDTO createRoom(RoomDTO createDTO);

	// 특정 숙소 번호에 해당하는 객실 목록 조회 기능
	List<RoomDTO> getRoomsByLodgingNo(Long lodgingNo);

	// 객실 상세 조회 기능
	RoomDTO getRoomDetail(Long roomNo);

	RoomDTO getRoomForManagement(Long roomNo);

	// 객실 수정 기능
	RoomDTO updateRoom(Long roomNo, RoomDTO updateDTO);

	// 객실 삭제 기능
	void deleteRoom(Long roomNo);

	// 전체 객실 목록 조회 기능
	List<RoomDTO> getAllRooms();

	// 상태별 객실 목록 조회 기능
	List<RoomDTO> getRoomsByStatus(RoomStatus status);

	// 객실명 검색 기능
	List<RoomDTO> searchRoomsByName(String keyword);

	// 특정 숙소 번호 + 상태별 객실 목록 조회 기능
	List<RoomDTO> getRoomsByLodgingNoAndStatus(Long lodgingNo, RoomStatus status);

}
