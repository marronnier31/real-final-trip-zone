package com.kh.trip.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.kh.trip.domain.Coupon;
import com.kh.trip.domain.User;
import com.kh.trip.domain.UserCoupon;
import com.kh.trip.dto.CouponDTO;
import com.kh.trip.dto.PageRequestDTO;
import com.kh.trip.dto.PageResponseDTO;
import com.kh.trip.dto.UserCouponDTO;
import com.kh.trip.repository.CouponRepository;
import com.kh.trip.repository.UserCouponRepository;
import com.kh.trip.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@Log4j2
@Service
@RequiredArgsConstructor
@Transactional
public class UserCouponServiceImpl implements UserCouponService {

	private final UserCouponRepository repository;
	private final UserRepository userRepository;
	private final CouponRepository couponRepository;

	@Override
	public Long save(Long userNo, UserCouponDTO userCouponDTO) {
		UserCoupon userCoupon = dtoToEntity(userNo, userCouponDTO);

		if (userCoupon.getStatus() == null) {
			userCoupon.determineFinalStatus();
		}

		return repository.save(userCoupon).getUserCouponNo();
	}

	@Override
	public PageResponseDTO<UserCouponDTO> findAll(Long userNo, PageRequestDTO pageRequestDTO) {
		Pageable pageable = PageRequest.of(pageRequestDTO.getPage() - 1, pageRequestDTO.getSize(),
				Sort.by("userCouponNo").descending());

		Page<UserCoupon> result = repository.findByUser(userNo, pageable);

		List<UserCouponDTO> dtoList = entityToDTO(result);

		Long totalCount = result.getTotalElements();

		PageResponseDTO<UserCouponDTO> responseDTO = PageResponseDTO.<UserCouponDTO>withAll().dtoList(dtoList)
				.pageRequestDTO(pageRequestDTO).totalCount(totalCount).build();
		return responseDTO;
	}

	// dto -> entity
	public UserCoupon dtoToEntity(Long userNo, UserCouponDTO userCouponDTO) {
		 User user = userRepository.findById(userNo)
		            .orElseThrow(() -> new IllegalAccessError("존재하지 않는 사용자 번호입니다."));

		    Coupon coupon = couponRepository.findById(userCouponDTO.getCouponNo())
		            .orElseThrow(() -> new IllegalAccessError("존재하지 않는 쿠폰 번호입니다."));

		    if (coupon.getStartDate().isAfter(LocalDateTime.now())) {
		        throw new IllegalStateException("아직 발급 기간이 아닌 쿠폰입니다. 발급 시작일: " + coupon.getStartDate());
		    }

		    boolean checkUserCoupon = repository.existenceCheck(userNo, userCouponDTO.getCouponNo());

		    if (checkUserCoupon) {
		        throw new IllegalStateException("이미 보유하고 있는 쿠폰입니다.");
		    }

		    return UserCoupon.builder()
		            .user(user)
		            .coupon(coupon)
		            .issuedAt(userCouponDTO.getIssuedAt())
		            .usedAt(userCouponDTO.getUsedAt())
		            .status(userCouponDTO.getStatus())
		            .build();
	}

	// entity -> dto
	public List<UserCouponDTO> entityToDTO(Page<UserCoupon> result) {
		return result.getContent().stream().map(userCoupon -> {
			CouponDTO couponDTO = CouponDTO.builder().couponName(userCoupon.getCoupon().getCouponName())
					.discountType(userCoupon.getCoupon().getDiscountType())
					.discountValue(userCoupon.getCoupon().getDiscountValue())
					.startDate(userCoupon.getCoupon().getStartDate()).endDate(userCoupon.getCoupon().getEndDate())
					.status(userCoupon.getCoupon().getStatus()).build();
			return UserCouponDTO.builder().userCouponNo(userCoupon.getUserCouponNo())
					.userNo(userCoupon.getUser().getUserNo()).couponNo(userCoupon.getCoupon().getCouponNo())
					.couponDTO(couponDTO).issuedAt(userCoupon.getIssuedAt()).usedAt(userCoupon.getUsedAt())
					.status(userCoupon.determineFinalStatus()).build();
		}).collect(Collectors.toList());
	}
}
