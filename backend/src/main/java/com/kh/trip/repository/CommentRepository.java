package com.kh.trip.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.kh.trip.domain.Comment;

public interface CommentRepository extends JpaRepository<Comment, Long>{
	//findAll
	Page<Comment> findAll(Pageable pageable);

	List<Comment> findByInquiry_InquiryNoOrderByRegDateAsc(Long inquiryNo);

}
