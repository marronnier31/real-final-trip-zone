package com.kh.trip.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.kh.trip.domain.Coupon;
import com.kh.trip.domain.User;
import com.kh.trip.domain.enums.CouponStatus;
import com.kh.trip.dto.CouponDTO;
import com.kh.trip.repository.CouponRepository;
import com.kh.trip.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class CouponServiceImpl implements CouponService {
	private final CouponRepository repository;
	private final UserRepository userRepository;

	@Override
	public Long save(CouponDTO couponDTO) {
		Coupon coupon = dtoToEntity(couponDTO);
		return repository.save(coupon).getCouponNo();
	}

	@Override
	public List<CouponDTO> findAll() {
		List<Coupon> result = repository.findAll();
		return entityToDTO(result);
	}

	@Override
	public void update(CouponDTO couponDTO) {
		Optional<Coupon> result = repository.findById(couponDTO.getCouponNo());
		Coupon coupon = result.orElseThrow();
		coupon.changeCouponName(couponDTO.getCouponName());
		coupon.changeDiscountType(couponDTO.getDiscountType());
		coupon.changeDiscountValue(couponDTO.getDiscountValue());
		coupon.changeStartDate(couponDTO.getStartDate());
		coupon.changeEndDate(couponDTO.getEndDate());
		if (couponDTO.getStatus() != null) {
			coupon.changeStatus(couponDTO.getStatus());
		}
		repository.save(coupon);
	}

	@Override
	public void delete(Long couponNo) {
		Optional<Coupon> result = repository.findById(couponNo);
		Coupon coupon = result.orElseThrow();
		coupon.changeStatus(CouponStatus.DELETE);
		repository.save(coupon);
	}

	public Coupon dtoToEntity(CouponDTO couponDTO) {
		User user = userRepository.findById(couponDTO.getAdminUser())
				.orElseThrow(() -> new IllegalArgumentException("존재하지 않는 관리자 번호입니다."));

		CouponStatus status = CouponStatus.ACTIVE;

		if (couponDTO.getStartDate().isAfter(LocalDateTime.now()))
			status = CouponStatus.INACTIVE;

		return Coupon.builder().user(user).couponName(couponDTO.getCouponName())
				.discountType(couponDTO.getDiscountType()).discountValue(couponDTO.getDiscountValue())
				.startDate(couponDTO.getStartDate()).endDate(couponDTO.getEndDate()).status(status).build();
	}

	public List<CouponDTO> entityToDTO(List<Coupon> result) {
		return result.stream()
				.map(coupon -> CouponDTO.builder().couponNo(coupon.getCouponNo()).couponName(coupon.getCouponName())
						.adminUser(coupon.getUser().getUserNo()).discountType(coupon.getDiscountType())
						.discountValue(coupon.getDiscountValue()).startDate(coupon.getStartDate())
						.endDate(coupon.getEndDate()).status(coupon.getStatus()).build())
				.collect(Collectors.toList());
	}

}
