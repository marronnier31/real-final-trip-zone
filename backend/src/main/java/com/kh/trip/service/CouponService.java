package com.kh.trip.service;

import java.util.List;

import com.kh.trip.dto.CouponDTO;

public interface CouponService {

	Long save(CouponDTO couponDTO);

	List<CouponDTO> findAll();

	void update(CouponDTO couponDTO);

	void delete(Long couponNo);
	
}
