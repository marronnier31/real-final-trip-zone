package com.kh.trip.service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.kh.trip.domain.Lodging;
import com.kh.trip.domain.User;
import com.kh.trip.domain.WishList;
import com.kh.trip.dto.LodgingDTO;
import com.kh.trip.dto.PageRequestDTO;
import com.kh.trip.dto.PageResponseDTO;
import com.kh.trip.dto.WishListDTO;
import com.kh.trip.repository.LodgingRepository;
import com.kh.trip.repository.UserRepository;
import com.kh.trip.repository.WishListRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RequiredArgsConstructor
@Service
@Slf4j
@Transactional
public class WishListServiceImpl implements WishListService {

	private final WishListRepository wishListRepository;
	private final UserRepository userRepository;
	private final LodgingRepository lodgingRepository;

	// findAll(list)
	@Override
	public PageResponseDTO<WishListDTO> findAll(Long userNo, PageRequestDTO pageRequestDTO) {

		Pageable pageable = PageRequest.of(pageRequestDTO.getPage() - 1, pageRequestDTO.getSize(),
				Sort.by("wishListNo").descending());

		Page<WishList> result = wishListRepository.findByUserUserNo(userNo, pageable);

		List<WishListDTO> dtoList = result.getContent().stream().map(wishList -> {
			// 1. 숙소 정보 조회
			Optional<Lodging> resultLodging = lodgingRepository.findById(wishList.getLodging().getLodgingNo());
			Lodging lodging = resultLodging.orElseThrow();

			// 2. LodgingDTO 생성
			LodgingDTO lodgingDTO = LodgingDTO.builder().lodgingNo(lodging.getLodgingNo())
					.lodgingName(lodging.getLodgingName()).address(lodging.getAddress()).build();

			// 3. WishListDTO 생성 및 반환
			return WishListDTO.builder().wishListNo(wishList.getWishListNo()).userNo(wishList.getUser().getUserNo())
					.lodgingNo(wishList.getLodging().getLodgingNo()).lodgingDTO(lodgingDTO).build();
		}).collect(Collectors.toList());

		long totalCount = result.getTotalElements();

		return PageResponseDTO.<WishListDTO>withAll().dtoList(dtoList).totalCount(totalCount)
				.pageRequestDTO(pageRequestDTO).build();
	}

	// save
	@Override
	@Transactional
	public Long save(Long userNo, WishListDTO dto) {
		log.info("WishList Toggle Start.........."); // toggle = 스위치

		// 사용자/숙소가 진짜 있는지 확인 (기존 코드 유지)
		User user = userRepository.findById(userNo).orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다."));
		Lodging lodging = lodgingRepository.findById(dto.getLodgingNo())
				.orElseThrow(() -> new IllegalArgumentException("존재하지 않는 숙소입니다."));

		// [추가] "이미 찜했는지" DB에서 찾아보기
		Optional<WishList> found = wishListRepository.findByUserAndLodging(user, lodging);

		// 상황에 따라 다르게 행동하기
		if (found.isPresent()) {
			wishListRepository.delete(found.get());
			log.info(">>>> 이미 찜한 상태라 삭제(취소) 처리함");
			return 0L; // "삭제됨"을 알리는 신호
		} else {
			WishList wishList = WishList.builder().user(user).lodging(lodging).build();

			log.info(">>>> 찜이 안 된 상태라 새롭게 저장함");
			return wishListRepository.save(wishList).getWishListNo(); // "저장됨"을 알리는 신호
		}
	}

	// delete
	@Override
	public void delete(Long wishListNo, Long userNo) {
		WishList wishList = wishListRepository.findById(wishListNo)
				.orElseThrow(() -> new IllegalArgumentException("존재하지 않는 찜 번호입니다."));

		if (!wishList.getUser().getUserNo().equals(userNo)) {
			throw new IllegalArgumentException("본인 찜만 삭제할 수 있습니다.");
		}

		wishListRepository.delete(wishList);
	}

}
