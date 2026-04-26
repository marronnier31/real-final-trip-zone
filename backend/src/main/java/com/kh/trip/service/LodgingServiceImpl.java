package com.kh.trip.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.stream.Collectors;

import javax.sql.DataSource;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.kh.trip.domain.HostProfile;
import com.kh.trip.domain.Lodging;
import com.kh.trip.domain.LodgingImage;
import com.kh.trip.domain.Room;
import com.kh.trip.domain.RoomImage;
import com.kh.trip.domain.enums.LodgingStatus;
import com.kh.trip.domain.enums.RoomStatus;
import com.kh.trip.dto.LodgingDTO;
import com.kh.trip.dto.PageRequestDTO;
import com.kh.trip.dto.PageResponseDTO;
import com.kh.trip.dto.RoomDTO;
import com.kh.trip.dto.SellerDashboardLodgingSummaryDTO;
import com.kh.trip.repository.HostProfileRepository;
import com.kh.trip.repository.LodgingRepository;
import com.kh.trip.repository.ReviewRepository;
import com.kh.trip.repository.RoomImageRepository;
import com.kh.trip.repository.RoomRepository;
import com.kh.trip.util.CustomFileUtil;

import lombok.RequiredArgsConstructor;

/**
 * LodgingService 인터페이스를 실제로 구현하는 클래스
 * 
 * @Service - 스프링이 이 클래스를 서비스 빈(Bean)으로 등록해준다.
 * 
 * @RequiredArgsConstructor - final 필드를 매개변수로 받는 생성자를 Lombok이 자동 생성해준다. - 즉, 생성자
 *                          주입 방식으로 LodgingRepository를 자동 주입받는다.
 * 
 * @Transactional - DB 작업을 하나의 트랜잭션 단위로 처리한다. - create / update / delete 같은 변경
 *                작업에서 특히 중요하다.
 */

@Service
@RequiredArgsConstructor
@Transactional
public class LodgingServiceImpl implements LodgingService {

	private final LodgingRepository lodgingRepository;
	private final RoomRepository roomRepository;
	private final RoomImageRepository roomImageRepository;
	private final HostProfileRepository hostProfileRepository;
	private final ReviewRepository reviewRepository;
	private final CustomFileUtil fileUtil;
	private final DataSource dataSource;

	// 숙소 등록
	@Override
	public LodgingDTO createLodging(LodgingDTO lodgingDTO) {

		// 컨트롤러에서 하던 파일 저장을 서비스에서 처리
		List<String> uploadFileNames = saveUploadedFiles(lodgingDTO.getFiles());
		lodgingDTO.setUploadFileNames(uploadFileNames);

		Lodging lodging = toLodgingEntity(lodgingDTO);

		// null 체크
		if (lodging == null) {
			throw new IllegalArgumentException("숙소 정보가 없습니다.");
		}

		// 숙소명 필수 체크
		if (lodging.getLodgingName() == null || lodging.getLodgingName().isBlank()) {
			throw new IllegalArgumentException("숙소명은 필수입니다.");
		}

		// 숙소 유형 필수 체크
		if (lodging.getLodgingType() == null) {
			throw new IllegalArgumentException("숙소 유형은 필수입니다.");
		}

		// 주소 필수 체크
		if (lodging.getAddress() == null || lodging.getAddress().isBlank()) {
			throw new IllegalArgumentException("주소는 필수입니다.");
		}

		// 상태값이 없으면 ACTIVE로 기본 설정
		if (lodging.getStatus() == null) {
			lodging.changeStatus(LodgingStatus.ACTIVE);
		}

		// roomDTO가 없으면 빈 리스트 생성
		List<Room> roomList = lodgingDTO.getRooms() == null ? List.of()
				: lodgingDTO.getRooms().stream().map(this::toRoomEntity).collect(Collectors.toList());

		// 레거시 스키마는 이미지 번호를 두 컬럼에 동시에 요구한다.
		assignLodgingImageNumbers(lodging);
		// 숙소 먼저 저장해서 lodgingNo 생성
		Lodging savedLodging = lodgingRepository.save(lodging);

		if (!roomList.isEmpty()) {
			roomList.forEach(room -> room.changeLodging(savedLodging));
			roomRepository.saveAll(roomList);
		}

		return toLodgingDTO(savedLodging);
	}
	
	
	

	// 숙소 단건 조회
	@Override
	@Transactional(readOnly = true)
	public LodgingDTO getLodging(Long lodgingNo) {
		Lodging lodging = lodgingRepository.findById(lodgingNo)
				.orElseThrow(() -> new NoSuchElementException("해당 숙소를 찾을 수 없습니다. lodgingNo=" + lodgingNo));

		// 일반 사용자 조회에서는 비활성화된 숙소를 막기 위한 상태 체크
		if (lodging.getStatus() != LodgingStatus.ACTIVE) {
			throw new NoSuchElementException("비활성화된 숙소입니다. lodgingNo=" + lodgingNo);
		}

		LodgingDTO lodgingDTO = toLodgingDTO(lodging);
		applyReviewSummaries(List.of(lodgingDTO));
		return lodgingDTO;
	}

	// 숙소 전체 목록 조회
	@Override
	@Transactional(readOnly = true)
	public List<LodgingDTO> getAllLodgings() {
		List<Object[]> result = lodgingRepository.selectList();

		List<LodgingDTO> dtoList = result.stream().map(arr -> {
			Lodging lodging = (Lodging) arr[0];
			LodgingImage image = (LodgingImage) arr[1];

			LodgingDTO lodgingDTO = toLodgingDTO(lodging);
			lodgingDTO.setRooms(loadAvailableRoomDTOs(lodging.getLodgingNo()));

			String imageStr = image != null ? image.getFileName() : null;
			if (imageStr != null) {
				lodgingDTO.setUploadFileNames(List.of(imageStr));
			}

			return lodgingDTO;
		}).collect(Collectors.toList());

		applyReviewSummaries(dtoList);
		return dtoList;
	}

	@Override
	@Transactional(readOnly = true)
	public List<LodgingDTO> getLodgingsByHostNo(Long hostNo) {
		List<LodgingDTO> dtoList = lodgingRepository.findByHost_HostNo(hostNo).stream()
				.map(this::toLodgingDTO)
				.peek(dto -> dto.setRooms(loadRoomDTOs(dto.getLodgingNo())))
				.toList();
		applyReviewSummaries(dtoList);
		return dtoList;
	}

	@Override
	@Transactional(readOnly = true)
	public List<SellerDashboardLodgingSummaryDTO> getSellerDashboardLodgingSummaries(Long hostNo) {
		List<Lodging> lodgings = lodgingRepository.findByHost_HostNo(hostNo);
		List<Long> lodgingNos = lodgings.stream().map(Lodging::getLodgingNo).toList();
		Map<Long, Integer> roomCounts = lodgingNos.isEmpty()
			? new HashMap<>()
			: roomRepository.sumRoomCountsByLodgingNos(lodgingNos).stream()
				.collect(Collectors.toMap(
					row -> (Long) row[0],
					row -> ((Number) row[1]).intValue()
				));

		return lodgings.stream()
			.map(lodging -> SellerDashboardLodgingSummaryDTO.builder()
				.lodgingNo(lodging.getLodgingNo())
				.lodgingName(lodging.getLodgingName())
				.region(lodging.getRegion())
				.status(lodging.getStatus())
				.roomCount(roomCounts.getOrDefault(lodging.getLodgingNo(), 0))
				.build())
			.toList();
	}
	
	//숙소 목록 페이징 
	@Override
	@Transactional(readOnly = true)
	public PageResponseDTO<LodgingDTO> getAllLodgings(PageRequestDTO pageRequestDTO) {

		// page는 1부터 시작하지만 PageRequest는 0부터 시작하므로 -1
		Pageable pageable = PageRequest.of(
				pageRequestDTO.getPage() - 1,
				pageRequestDTO.getSize(),
				Sort.by("lodgingNo").descending()
		);

		// ACTIVE 상태 숙소만 페이징 조회
		Page<Lodging> result = lodgingRepository.findByStatus(LodgingStatus.ACTIVE, pageable);

		// Entity -> DTO 변환
		List<LodgingDTO> dtoList = result.getContent().stream()
				.map(this::toLodgingDTO)
				.toList();

		applyReviewSummaries(dtoList);

		//  PageResponseDTO 
		return PageResponseDTO.<LodgingDTO>withAll()
				.dtoList(dtoList)
				.pageRequestDTO(pageRequestDTO)
				.totalCount(result.getTotalElements())
				.build();
	}

	// 지역으로 숙소 목록 조회
	@Override
	@Transactional(readOnly = true)
	public List<LodgingDTO> getLodgingsByRegion(String region) {
		if (region == null || region.isBlank()) {
			throw new IllegalArgumentException("지역 값이 비어 있습니다.");
		}

		List<LodgingDTO> dtoList = lodgingRepository.findByRegionAndStatus(region, LodgingStatus.ACTIVE).stream()
				.map(this::toLodgingDTO)
				.toList();
		applyReviewSummaries(dtoList);
		return dtoList;
	}

	// 숙소명 키워드 검색
	@Override
	@Transactional(readOnly = true)
	public List<LodgingDTO> searchLodgingsByName(String keyword) {
		if (keyword == null || keyword.isBlank()) {
			throw new IllegalArgumentException("검색어가 비어 있습니다.");
		}

		List<LodgingDTO> dtoList = lodgingRepository.findByLodgingNameContainingAndStatus(keyword, LodgingStatus.ACTIVE).stream()
				.map(this::toLodgingDTO).toList();
		applyReviewSummaries(dtoList);
		return dtoList;
	}

	// 숙소 수정
	@Override
	public LodgingDTO updateLodging(Long lodgingNo, LodgingDTO lodgingDTO) {
		
		Lodging findLodging = lodgingRepository.findById(lodgingNo)
				.orElseThrow(() -> new NoSuchElementException("수정할 숙소가 존재하지 않습니다. lodgingNo=" + lodgingNo));

		// 수정 전에 기존 이미지 파일명 목록 보관
		List<String> oldFileNames = extractFileNames(findLodging.getImageList());

		applyLodgingUpdate(findLodging, lodgingDTO);

		boolean hasImagePayload = lodgingDTO.getUploadFileNames() != null;
		List<String> currentUploadFileNames = saveUploadedFiles(lodgingDTO.getFiles());
		boolean hasNewUploadedFiles = currentUploadFileNames != null && !currentUploadFileNames.isEmpty();
		List<String> uploadFileNames = oldFileNames;

		if (hasImagePayload || hasNewUploadedFiles) {
			uploadFileNames = lodgingDTO.getUploadFileNames() == null ? new ArrayList<>() : new ArrayList<>(lodgingDTO.getUploadFileNames());
			if (hasNewUploadedFiles) {
				uploadFileNames.addAll(currentUploadFileNames);
			}

			findLodging.clearList();

			if (!uploadFileNames.isEmpty()) {
				uploadFileNames.forEach(uploadName -> {
					findLodging.addImageString(uploadName);
				});
			}

			assignLodgingImageNumbers(findLodging);
		}

		Lodging updatedLodging = lodgingRepository.save(findLodging);
		List<String> finalUploadFileNames = uploadFileNames;

		// 예전 파일들 중에서 더 이상 유지되지 않는 실제 파일 삭제
		if (oldFileNames != null && !oldFileNames.isEmpty()) {
			List<String> removeFiles = oldFileNames.stream().filter(fileName -> !finalUploadFileNames.contains(fileName))
					.toList();

			fileUtil.deleteFiles(removeFiles);
		}

		return toLodgingDTO(updatedLodging);
	}

	// 숙소 수정값 반영 메서드 수정 기능
	// @Setter 방식 대신 엔티티의 change 메서드만 사용하도록 변경
	private void applyLodgingUpdate(Lodging findLodging, LodgingDTO lodgingDTO) {

		if (lodgingDTO.getLodgingName() != null && !lodgingDTO.getLodgingName().isBlank()) {
			findLodging.changeLodgingName(lodgingDTO.getLodgingName());
		}

		if (lodgingDTO.getDescription() != null) {
			findLodging.changeDescription(lodgingDTO.getDescription());
		}

		if (lodgingDTO.getCheckInTime() != null) {
			findLodging.changeCheckInTime(lodgingDTO.getCheckInTime());
		}

		if (lodgingDTO.getCheckOutTime() != null) {
			findLodging.changeCheckOutTime(lodgingDTO.getCheckOutTime());
		}

		if (lodgingDTO.getStatus() != null) {
			findLodging.changeStatus(lodgingDTO.getStatus());
		}
	}

	// 숙소 삭제
	@Override
	public void deleteLodging(Long lodgingNo) {
		Lodging findLodging = lodgingRepository.findById(lodgingNo)
				.orElseThrow(() -> new NoSuchElementException("삭제할 숙소가 존재하지 않습니다. lodgingNo=" + lodgingNo));

		// 삭제 전에 실제 파일명 목록 확보
		List<String> oldFileNames = extractFileNames(findLodging.getImageList());

		findLodging.changeStatus(LodgingStatus.INACTIVE);

		// orphanRemoval = true 이므로 이미지 연관관계도 같이 비움
		findLodging.clearList();

		lodgingRepository.save(findLodging);

		List<Room> roomList = roomRepository.findByLodging_LodgingNo(lodgingNo);
		if (roomList != null && !roomList.isEmpty()) {
			// 숙소 삭제 시 해당 숙소의 객실도 함께 예약 불가 상태로 변경
			roomList.forEach(room -> room.changeStatus(RoomStatus.UNAVAILABLE));
			roomRepository.saveAll(roomList);
		}
		// 실제 이미지 파일 삭제
		fileUtil.deleteFiles(oldFileNames);
	}

	// 숙소 상세보기용
	@Override
	@Transactional(readOnly = true)
	public LodgingDTO getLodgingDetail(Long lodgingNo) {
		// 1. 숙소 기본 정보 조회 & 이미지목록 조인해서 같이 조회
		Optional<Lodging> result = lodgingRepository.selectOne(lodgingNo);

		// 예외 메시지 추가
		Lodging lodging = result
				.orElseThrow(() -> new NoSuchElementException("해당 숙소를 찾을 수 없습니다. lodgingNo=" + lodgingNo));

		// 비활성화된 숙소는 상세 조회에서 제외
		if (lodging.getStatus() != LodgingStatus.ACTIVE) {
			throw new NoSuchElementException("비활성화된 숙소입니다. lodgingNo=" + lodgingNo);
		}

		// 2. 객실 목록 조회
		// 상세보기에서는 AVAILABLE 상태의 객실만 조회
		// 3. lodging entity를 dto로 변환
		LodgingDTO lodgingDTO = toLodgingDTO(lodging);
		lodgingDTO.setRooms(loadAvailableRoomDTOs(lodgingNo));

		applyReviewSummaries(List.of(lodgingDTO));
		return lodgingDTO;
	}

	private void applyReviewSummaries(List<LodgingDTO> dtoList) {
		if (dtoList == null || dtoList.isEmpty()) {
			return;
		}

		List<Long> lodgingNos = dtoList.stream()
				.map(LodgingDTO::getLodgingNo)
				.filter(java.util.Objects::nonNull)
				.toList();

		if (lodgingNos.isEmpty()) {
			return;
		}

		Map<Long, ReviewRepository.LodgingReviewSummary> summaryMap = reviewRepository.summarizeVisibleByLodgingNos(lodgingNos)
				.stream()
				.collect(Collectors.toMap(ReviewRepository.LodgingReviewSummary::getLodgingNo, summary -> summary, (left, right) -> left, HashMap::new));

		dtoList.forEach(lodgingDTO -> {
			ReviewRepository.LodgingReviewSummary summary = summaryMap.get(lodgingDTO.getLodgingNo());
			if (summary == null) {
				lodgingDTO.setReviewCount(0L);
				lodgingDTO.setReviewAverage(0.0);
				return;
			}

			lodgingDTO.setReviewCount(summary.getReviewCount() != null ? summary.getReviewCount() : 0L);
			lodgingDTO.setReviewAverage(summary.getReviewAverage() != null ? summary.getReviewAverage() : 0.0);
		});
	}

	private List<RoomDTO> loadAvailableRoomDTOs(Long lodgingNo) {
		List<Room> rooms = roomRepository.findByLodging_LodgingNoAndStatusOrderByRoomNoAsc(lodgingNo,
				RoomStatus.AVAILABLE);
		return mapRoomDTOs(rooms);
	}

	private List<RoomDTO> loadRoomDTOs(Long lodgingNo) {
		List<Room> rooms = roomRepository.findByLodging_LodgingNo(lodgingNo);
		return mapRoomDTOs(rooms);
	}

	private List<RoomDTO> mapRoomDTOs(List<Room> rooms) {
		return rooms.stream().map(room -> {
			List<String> imageUrls = roomImageRepository.findByRoom_RoomNoOrderBySortOrderAsc(room.getRoomNo()).stream()
					.map(RoomImage::getImageUrl).toList();

			return toRoomDTO(room, imageUrls);
		}).collect(Collectors.toList());
	}

	// DTO -> Entity 변환 메서드를 Impl 내부로 이동
	private Lodging toLodgingEntity(LodgingDTO lodgingDTO) {

		// hostNo로 실제 User 엔티티 조회

		HostProfile host = hostProfileRepository.findById(lodgingDTO.getHostNo())
				.orElseThrow(() -> new IllegalArgumentException("존재하지 않는 호스트입니다. hostNo=" + lodgingDTO.getHostNo()));

		Lodging lodging = Lodging.builder().lodgingNo(lodgingDTO.getLodgingNo()) // 숙소 번호 세팅
				.host(host) // User 엔티티 세팅
				.lodgingName(lodgingDTO.getLodgingName()) // 숙소명 세팅
				.lodgingType(lodgingDTO.getLodgingType()) // 숙소 유형 세팅
				.region(lodgingDTO.getRegion()) // 지역 세팅
				.address(lodgingDTO.getAddress()) // 주소 세팅
				.detailAddress(lodgingDTO.getDetailAddress()) // 상세 주소 세팅
				.zipCode(lodgingDTO.getZipCode()) // 우편번호 세팅
				.latitude(lodgingDTO.getLatitude()) // 위도 세팅
				.longitude(lodgingDTO.getLongitude()) // 경도 세팅
				.description(lodgingDTO.getDescription()) // 설명 세팅
				.checkInTime(lodgingDTO.getCheckInTime()) // 체크인 시간 세팅
				.checkOutTime(lodgingDTO.getCheckOutTime()) // 체크아웃 시간 세팅
				.status(lodgingDTO.getStatus()) // 상태 세팅
				.build(); // Entity 생성

		// 업로드 처리가 끝난 파일들의 이름 리스트
		List<String> uploadFileNames = lodgingDTO.getUploadFileNames();
		if (uploadFileNames == null) {
			return lodging;
		}
		uploadFileNames.forEach(uploadName -> {
			lodging.addImageString(uploadName);
		});

		return lodging;
	}

	// Entity -> DTO 변환 메서드를 Impl 내부로 이동
	private LodgingDTO toLodgingDTO(Lodging lodging) {
		LodgingDTO lodgingDTO = LodgingDTO.builder().lodgingNo(lodging.getLodgingNo()) // 숙소 번호 세팅
				.hostNo(lodging.getHost().getHostNo()) // User 엔티티에서 호스트 번호 꺼내기
				.lodgingName(lodging.getLodgingName()) // 숙소명 세팅
				.lodgingType(lodging.getLodgingType()) // 숙소 유형 세팅
				.region(lodging.getRegion()) // 지역 세팅
				.address(lodging.getAddress()) // 주소 세팅
				.detailAddress(lodging.getDetailAddress()) // 상세 주소 세팅
				.zipCode(lodging.getZipCode()) // 우편번호 세팅
				.latitude(lodging.getLatitude()) // 위도 세팅
				.longitude(lodging.getLongitude()) // 경도 세팅
				.description(lodging.getDescription()) // 설명 세팅
				.checkInTime(lodging.getCheckInTime()) // 체크인 시간 세팅
				.checkOutTime(lodging.getCheckOutTime()) // 체크아웃 시간 세팅
				.status(lodging.getStatus()) // 상태 세팅
				.reviewAverage(0.0)
				.reviewCount(0L)
				.build(); // DTO 생성

		List<LodgingImage> imageList = lodging.getImageList();

		if (imageList == null || imageList.isEmpty()) {
			return lodgingDTO;
		}

		List<String> fileNameList = imageList.stream().map(LodgingImage::getFileName).toList();

		lodgingDTO.setUploadFileNames(fileNameList);
		return lodgingDTO;
	}

	// 업로드 파일들을 실제 저장하고 저장된 파일명 목록을 반환하는 공통 메서드
	private List<String> saveUploadedFiles(List<MultipartFile> files) {
		if (files == null || files.isEmpty()) {
			return List.of();
		}

		if (files.get(0).isEmpty()) {
			return List.of();
		}

		return fileUtil.saveFiles(files);
	}

	// LodgingImage 리스트에서 파일명만 추출하는 공통 메서드
	private List<String> extractFileNames(List<LodgingImage> imageList) {
		if (imageList == null || imageList.isEmpty()) {
			return List.of();
		}

		return imageList.stream().map(LodgingImage::getFileName).toList();
	}

	private void assignLodgingImageNumbers(Lodging lodging) {
		if (lodging.getImageList() == null || lodging.getImageList().isEmpty()) {
			return;
		}

		lodging.getImageList().stream()
				.filter(image -> image.getImageNo() == null)
				.forEach(image -> image.assignImageNo(nextLodgingImageNo()));
	}

	private Long nextLodgingImageNo() {
		try (var connection = dataSource.getConnection();
				var preparedStatement = connection.prepareStatement("select SEQ_LODGING_IMAGES.nextval from dual");
				var resultSet = preparedStatement.executeQuery()) {
			if (!resultSet.next()) {
				throw new IllegalStateException("SEQ_LODGING_IMAGES 값을 읽지 못했습니다.");
			}
			return resultSet.getLong(1);
		} catch (Exception exception) {
			throw new IllegalStateException("SEQ_LODGING_IMAGES 값을 읽지 못했습니다.", exception);
		}
	}

	// RoomSummaryDTO -> Room Entity 변환도 Impl 내부에서 처리
	private Room toRoomEntity(RoomDTO roomDTO) {
		return Room.builder().roomName(roomDTO.getRoomName()) // 객실명 세팅
				.roomType(roomDTO.getRoomType()) // 객실 유형 세팅
				.roomDescription(roomDTO.getRoomDescription()) // 객실 설명 세팅
				.maxGuestCount(roomDTO.getMaxGuestCount()) // 최대 수용 인원 세팅
				.pricePerNight(roomDTO.getPricePerNight()) // 1박 가격 세팅
				.roomCount(roomDTO.getRoomCount()) // 객실 수 세팅
				.status(roomDTO.getStatus() != null ? roomDTO.getStatus() : RoomStatus.AVAILABLE) // 상태 세팅
				.build(); // Entity 생성
	}

	// 객실 이미지 URL 목록까지 포함해서 RoomDTO 생성
	private RoomDTO toRoomDTO(Room room, List<String> imageUrls) {
		return RoomDTO.builder().roomNo(room.getRoomNo()) // 객실 번호 세팅
				.lodgingNo(room.getLodging().getLodgingNo()).roomName(room.getRoomName()) // 객실명 세팅
				.roomType(room.getRoomType()) // 객실 유형 세팅
				.roomDescription(room.getRoomDescription()) // 객실 설명 세팅
				.maxGuestCount(room.getMaxGuestCount()) // 최대 수용 인원 세팅
				.pricePerNight(room.getPricePerNight()) // 1박 가격 세팅
				.roomCount(room.getRoomCount()) // 객실 수 세팅
				.status(room.getStatus()) // 상태 세팅
				.imageUrls(imageUrls) // 객실 이미지 목록 세팅
				.build(); // DTO 생성
	}
}
