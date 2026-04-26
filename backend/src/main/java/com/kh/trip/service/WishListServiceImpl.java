package com.kh.trip.service;

import java.util.Optional;

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

    @Override
    public PageResponseDTO<WishListDTO> findAll(Long userNo, PageRequestDTO pageRequestDTO) {
        Pageable pageable = PageRequest.of(pageRequestDTO.getPage() - 1, pageRequestDTO.getSize(),
                Sort.by("wishListNo").descending());

        Page<WishList> result = wishListRepository.findByUserUserNo(userNo, pageable);

        return PageResponseDTO.<WishListDTO>withAll()
                .dtoList(result.getContent().stream().map(this::toWishListDTO).toList())
                .totalCount(result.getTotalElements())
                .pageRequestDTO(pageRequestDTO)
                .build();
    }

    @Override
    public Long save(Long userNo, WishListDTO dto) {
        log.info("WishList Toggle Start..........");

        User user = userRepository.findById(userNo)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        Lodging lodging = lodgingRepository.findById(dto.getLodgingNo())
                .orElseThrow(() -> new IllegalArgumentException("숙소를 찾을 수 없습니다."));

        Optional<WishList> found = wishListRepository.findByUserAndLodging(user, lodging);

        if (found.isPresent()) {
            wishListRepository.delete(found.get());
            return 0L;
        }

        WishList wishList = WishList.builder().user(user).lodging(lodging).build();
        return wishListRepository.save(wishList).getWishListNo();
    }

    @Override
    public void delete(Long wishListNo, Long userNo) {
        WishList wishList = wishListRepository.findById(wishListNo)
                .orElseThrow(() -> new IllegalArgumentException("찜 정보를 찾을 수 없습니다."));

        if (!wishList.getUser().getUserNo().equals(userNo)) {
            throw new IllegalArgumentException("다른 사용자의 찜을 삭제할 수 없습니다.");
        }

        wishListRepository.delete(wishList);
    }

    private WishListDTO toWishListDTO(WishList wishList) {
        Lodging lodging = lodgingRepository.findById(wishList.getLodging().getLodgingNo()).orElseThrow();

        LodgingDTO lodgingDTO = LodgingDTO.builder()
                .lodgingNo(lodging.getLodgingNo())
                .lodgingName(lodging.getLodgingName())
                .address(lodging.getAddress())
                .build();

        return WishListDTO.builder()
                .wishListNo(wishList.getWishListNo())
                .userNo(wishList.getUser().getUserNo())
                .lodgingNo(lodging.getLodgingNo())
                .lodgingDTO(lodgingDTO)
                .name(lodging.getLodgingName())
                .meta(buildWishlistMeta(lodging))
                .price(null)
                .status("찜한 숙소")
                .build();
    }

    private String buildWishlistMeta(Lodging lodging) {
        if (lodging.getRegion() == null && lodging.getAddress() == null) {
            return null;
        }
        if (lodging.getRegion() == null) {
            return lodging.getAddress();
        }
        if (lodging.getAddress() == null) {
            return lodging.getRegion();
        }
        return lodging.getRegion() + " · " + lodging.getAddress();
    }
}
