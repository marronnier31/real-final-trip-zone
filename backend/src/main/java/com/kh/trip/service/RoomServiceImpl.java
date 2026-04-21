package com.kh.trip.service;

import java.util.List;
import java.util.stream.IntStream;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.kh.trip.domain.Lodging;
import com.kh.trip.domain.Room;
import com.kh.trip.domain.RoomImage;
import com.kh.trip.domain.enums.LodgingStatus;
import com.kh.trip.domain.enums.RoomStatus;
import com.kh.trip.dto.RoomDTO;
import com.kh.trip.repository.LodgingRepository;
import com.kh.trip.repository.RoomImageRepository;
import com.kh.trip.repository.RoomRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RoomServiceImpl implements RoomService {

	private final RoomRepository roomRepository;
	private final RoomImageRepository roomImageRepository;
	private final LodgingRepository lodgingRepository;

	// 객실 등록 기능
	@Override
	@Transactional
	public RoomDTO createRoom(RoomDTO roomDTO) {

		// 등록 요청값 기본 검증
		validateRoomDTOForCreate(roomDTO);

		// lodgingNo로 실제 Lodging 엔티티 조회
		Lodging lodging = lodgingRepository.findById(roomDTO.getLodgingNo())
				.orElseThrow(() -> new IllegalArgumentException("존재하지 않는 숙소입니다. lodgingNo=" + roomDTO.getLodgingNo()));

		// 비활성 숙소에는 객실 등록 불가
		if (lodging.getStatus() != LodgingStatus.ACTIVE) {
			throw new IllegalArgumentException("비활성화된 숙소에는 객실을 등록할 수 없습니다.");
		}

		// 등록 요청 DTO 값을 이용해서 Room 엔티티 생성
		Room room = Room.builder().lodging(lodging) // Lodging 엔티티 세팅
				.roomName(roomDTO.getRoomName()) // 객실명 세팅
				.roomType(roomDTO.getRoomType()) // 객실 유형 세팅
				.roomDescription(roomDTO.getRoomDescription()) // 객실 설명 세팅
				.maxGuestCount(roomDTO.getMaxGuestCount()) // 최대 수용 인원 세팅
				.pricePerNight(roomDTO.getPricePerNight()) // 1박 가격 세팅
				.roomCount(roomDTO.getRoomCount()) // 객실 수 세팅

				// status가 null이면 기본값 AVAILABLE 사용
				.status(roomDTO.getStatus() != null ? roomDTO.getStatus() : RoomStatus.AVAILABLE).build();

		// DB에 객실 저장
		Room savedRoom = roomRepository.save(room);

		// 객실 저장 후 ROOM_IMAGES 테이블에 이미지들도 같이 저장
		saveRoomImages(savedRoom, roomDTO.getImageUrls());

		// 저장된 객실의 이미지 URL 목록을 다시 조회
		List<String> imageUrls = roomImageRepository.findByRoom_RoomNoOrderBySortOrderAsc(savedRoom.getRoomNo())
				.stream().map(RoomImage::getImageUrl).toList();

		// RoomDTO 하나로
		return toRoomDTO(savedRoom, imageUrls);
	}

	@Override
	public List<RoomDTO> getRoomsByLodgingNo(Long lodgingNo) {
		// 숙소 번호에 해당하는 객실 목록 조회
		return roomRepository.findByLodging_LodgingNoAndStatusOrderByRoomNoAsc(lodgingNo, RoomStatus.AVAILABLE).stream()
				.map(room -> {
					List<String> imageUrls = roomImageRepository.findByRoom_RoomNoOrderBySortOrderAsc(room.getRoomNo())
							.stream().map(RoomImage::getImageUrl).toList();

					return toRoomDTO(room, imageUrls);
				}).toList();
	}

	@Override
	public RoomDTO getRoomDetail(Long roomNo) {
		// 객실 번호로 상세조회
		Room room = roomRepository.findById(roomNo)
				.orElseThrow(() -> new IllegalArgumentException("존재하지 않는 객실입니다. roomNo=" + roomNo));

		// 일반 상세조회에서는 AVAILABLE 상태 객실만 허용
		if (room.getStatus() != RoomStatus.AVAILABLE) {
			throw new IllegalArgumentException("사용할 수 없는 객실입니다. roomNo=" + roomNo);
		}

		// 상세 조회 시 객실 이미지 목록도 함께 조회
		List<String> imageUrls = roomImageRepository.findByRoom_RoomNoOrderBySortOrderAsc(roomNo).stream()
				.map(RoomImage::getImageUrl).toList();

		// RoomDTO 하나로
		return toRoomDTO(room, imageUrls);
	}

	@Override
	public RoomDTO getRoomForManagement(Long roomNo) {
		Room room = roomRepository.findById(roomNo)
				.orElseThrow(() -> new IllegalArgumentException("존재하지 않는 객실입니다. roomNo=" + roomNo));

		List<String> imageUrls = roomImageRepository.findByRoom_RoomNoOrderBySortOrderAsc(roomNo).stream()
				.map(RoomImage::getImageUrl).toList();

		return toRoomDTO(room, imageUrls);
	}

	@Override
	@Transactional
	public RoomDTO updateRoom(Long roomNo, RoomDTO roomDTO) {
		// 수정할 객실 조회
		Room room = roomRepository.findById(roomNo)
				.orElseThrow(() -> new IllegalArgumentException("존재하지 않는 객실입니다. roomNo=" + roomNo));

		// 숙소 변경 값이 들어온 경우 실제 Lodging 엔티티로 교체
		if (roomDTO.getLodgingNo() != null) {
			Lodging lodging = lodgingRepository.findById(roomDTO.getLodgingNo()).orElseThrow(
					() -> new IllegalArgumentException("존재하지 않는 숙소입니다. lodgingNo=" + roomDTO.getLodgingNo()));

			// 비활성 숙소로 객실 이동 불가
			if (lodging.getStatus() != LodgingStatus.ACTIVE) {
				throw new IllegalArgumentException("비활성화된 숙소로 객실을 이동할 수 없습니다.");
			}
			room.changeLodging(lodging);
		}

		// roomName 값이 들어왔을 때만 수정
		if (roomDTO.getRoomName() != null) {

			// 빈 값 방지
			if (roomDTO.getRoomType().isBlank()) {
				throw new IllegalArgumentException("객실 유형은 비워둘 수 없습니다.");
			}
			room.changeRoomName(roomDTO.getRoomName());
		}

		// roomType 값이 들어왔을 때만 수정
		if (roomDTO.getRoomType() != null) {
			room.changeRoomType(roomDTO.getRoomType());
		}

		// roomDescription 값이 들어왔을 때만 수정
		if (roomDTO.getRoomDescription() != null) {
			room.changeRoomDescription(roomDTO.getRoomDescription());
		}

		// maxGuestCount 값이 들어왔을 때만 수정
		if (roomDTO.getMaxGuestCount() != null) {
			// 최소값 검사
			if (roomDTO.getMaxGuestCount() < 1) {
				throw new IllegalArgumentException("최대 수용 인원은 1명 이상이어야 합니다.");
			}
			room.changeMaxGuestCount(roomDTO.getMaxGuestCount());
		}

		// pricePerNight 값이 들어왔을 때만 수정
		if (roomDTO.getPricePerNight() != null) {
			// 최소값 검사
			if (roomDTO.getPricePerNight() < 0) {
				throw new IllegalArgumentException("1박 가격은 0원 이상이어야 합니다.");
			}
			room.changePricePerNight(roomDTO.getPricePerNight());
		}

		// roomCount 값이 들어왔을 때만 수정
		if (roomDTO.getRoomCount() != null) {
			// 최소값 검사
			if (roomDTO.getRoomCount() < 1) {
				throw new IllegalArgumentException("객실 수는 1개 이상이어야 합니다.");
			}
			room.changeRoomCount(roomDTO.getRoomCount());
		}

		// status 값이 들어왔을 때만 수정
		if (roomDTO.getStatus() != null) {
			room.changeStatus(roomDTO.getStatus());
		}

		// imageUrls가 넘어온 경우에만 기존 이미지 교체
		if (roomDTO.getImageUrls() != null) {

			// 수정 시 기존 객실 이미지 전부 삭제
			roomImageRepository.deleteByRoom_RoomNo(roomNo);

			// 수정 요청으로 들어온 새 이미지 다시 저장
			saveRoomImages(room, roomDTO.getImageUrls());

		}

		// 수정 후 이미지 목록 다시 조회
		List<String> imageUrls = roomImageRepository.findByRoom_RoomNoOrderBySortOrderAsc(roomNo).stream()
				.map(RoomImage::getImageUrl).toList();

		// RoomDTO 하나로
		return toRoomDTO(room, imageUrls);
	}

	@Override
	@Transactional
	public void deleteRoom(Long roomNo) {
		// 삭제할 객실 조회
		Room room = roomRepository.findById(roomNo)
				.orElseThrow(() -> new IllegalArgumentException("존재하지 않는 객실입니다. roomNo=" + roomNo));

		// 객실 상태만 UNAVAILABLE로 변경
		room.changeStatus(RoomStatus.UNAVAILABLE);
	}

	// 전체 객실 목록 조회
	@Override
	public List<RoomDTO> getAllRooms() {
		// Room 테이블의 전체 데이터를 조회
		return roomRepository.findAllByOrderByRoomNoAsc().stream().map(room -> {
			List<String> imageUrls = roomImageRepository.findByRoom_RoomNoOrderBySortOrderAsc(room.getRoomNo()).stream()
					.map(RoomImage::getImageUrl).toList();

			return toRoomDTO(room, imageUrls);
		}).toList();
	}

	// 상태별 객실 목록 조회
	@Override
	public List<RoomDTO> getRoomsByStatus(RoomStatus status) { // [수정]
		return roomRepository.findByStatusOrderByRoomNoAsc(status).stream().map(room -> {
			List<String> imageUrls = roomImageRepository.findByRoom_RoomNoOrderBySortOrderAsc(room.getRoomNo()).stream()
					.map(RoomImage::getImageUrl).toList();
			return toRoomDTO(room, imageUrls);
		}).toList();
	}

	// 객실명 검색
	@Override
	public List<RoomDTO> searchRoomsByName(String keyword) {
		return roomRepository.findByRoomNameContainingOrderByRoomNoAsc(keyword).stream().map(room -> {
			List<String> imageUrls = roomImageRepository.findByRoom_RoomNoOrderBySortOrderAsc(room.getRoomNo()).stream()
					.map(RoomImage::getImageUrl).toList();
			return toRoomDTO(room, imageUrls);
		}).toList();
	}

	// 특정 숙소 번호 + 상태별 객실 목록 조회
	@Override
	public List<RoomDTO> getRoomsByLodgingNoAndStatus(Long lodgingNo, RoomStatus status) {
		// Room 엔티티가 lodging 객체를 가지므로 Repository 메서드도 연관관계 기준으로 바뀌어야 함
		return roomRepository.findByLodging_LodgingNoAndStatusOrderByRoomNoAsc(lodgingNo, status).stream().map(room -> {
			List<String> imageUrls = roomImageRepository.findByRoom_RoomNoOrderBySortOrderAsc(room.getRoomNo()).stream()
					.map(RoomImage::getImageUrl).toList();
			return toRoomDTO(room, imageUrls);
		}).toList();
	}

	// 객실 이미지 저장 공통 메서드
	private void saveRoomImages(Room room, List<String> imageUrls) {
		if (imageUrls == null || imageUrls.isEmpty()) {
			return;
		}

		IntStream.range(0, imageUrls.size()).mapToObj(
				index -> RoomImage.builder().room(room).imageUrl(imageUrls.get(index)).sortOrder(index + 1).build())
				.forEach(roomImageRepository::save);
	}

	// 객실 등록 시 기본 유효성 검사
	private void validateRoomDTOForCreate(RoomDTO roomDTO) {
		if (roomDTO == null) {
			throw new IllegalArgumentException("객실 정보가 없습니다.");
		}

		if (roomDTO.getLodgingNo() == null) {
			throw new IllegalArgumentException("숙소 번호는 필수입니다.");
		}

		if (roomDTO.getRoomName() == null || roomDTO.getRoomName().isBlank()) {
			throw new IllegalArgumentException("객실명은 필수입니다.");
		}

		if (roomDTO.getRoomType() == null || roomDTO.getRoomType().isBlank()) {
			throw new IllegalArgumentException("객실 유형은 필수입니다.");
		}

		if (roomDTO.getMaxGuestCount() == null || roomDTO.getMaxGuestCount() < 1) {
			throw new IllegalArgumentException("최대 수용 인원은 1명 이상이어야 합니다.");
		}

		if (roomDTO.getPricePerNight() == null || roomDTO.getPricePerNight() < 0) {
			throw new IllegalArgumentException("1박 가격은 0원 이상이어야 합니다.");
		}

		if (roomDTO.getRoomCount() == null || roomDTO.getRoomCount() < 1) {
			throw new IllegalArgumentException("객실 수는 1개 이상이어야 합니다.");
		}
	}

	// Room 엔티티를 RoomDTO로 변환하는 메서드
	private RoomDTO toRoomDTO(Room room, List<String> imageUrls) {
		return RoomDTO.builder().roomNo(room.getRoomNo()) // 객실 번호
				.lodgingNo(room.getLodging().getLodgingNo()) // 어떤 숙소에 속한 객실인지 보여주기 위해 추가
				.roomName(room.getRoomName()) // 객실 이름
				.roomType(room.getRoomType()) // 객실 타입
				.roomDescription(room.getRoomDescription()) // 객실 설명
				.maxGuestCount(room.getMaxGuestCount()) // 최대 수용 인원
				.pricePerNight(room.getPricePerNight()) // 1박 가격
				.roomCount(room.getRoomCount()) // 객실 개수
				.status(room.getStatus()) // 객실 상태
				.imageUrls(imageUrls) // 이미지 URL 목록
				.build();
	}
}
