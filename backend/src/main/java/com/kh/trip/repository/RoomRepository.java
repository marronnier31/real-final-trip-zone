package com.kh.trip.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import com.kh.trip.domain.Room;
import com.kh.trip.domain.enums.RoomStatus;

import jakarta.persistence.LockModeType;

public interface RoomRepository extends JpaRepository<Room, Long> {

	// 특정 숙소 번호에 해당하는 객실 목록 조회
	List<Room> findByLodging_LodgingNo(Long lodgingNo);

	// roomNo 오름차순으로 전체 객실 조회
	List<Room> findAllByOrderByRoomNoAsc();

	// 특정 상태에 해당하는 객실 목록을 roomNo 오름차순으로 조회
	List<Room> findByStatusOrderByRoomNoAsc(RoomStatus status);

	// 객실명에 keyword가 포함된 객실 목록을 roomNo 오름차순으로 조회
	List<Room> findByRoomNameContainingOrderByRoomNoAsc(String keyword);

	// 특정 숙소 번호 + 특정 상태에 해당하는 객실 목록을 roomNo 오름차순으로 조회
	List<Room> findByLodging_LodgingNoAndStatusOrderByRoomNoAsc(Long lodgingNo, RoomStatus status);

	@Lock(LockModeType.PESSIMISTIC_WRITE)
	Optional<Room> findByRoomNo(Long roomNo);

}
