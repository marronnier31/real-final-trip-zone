package com.kh.trip.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.kh.trip.domain.Lodging;
import com.kh.trip.domain.User;
import com.kh.trip.domain.WishList;


public interface WishListRepository extends JpaRepository<WishList, Long> {
	Optional<WishList> findByUserAndLodging(User user, Lodging lodging);
	
	Page<WishList> findByUserUserNo(Long userNo, Pageable pageable);
	
}