package com.kh.trip.service;

import java.util.List;

import com.kh.trip.domain.enums.MemberGradeName;
import com.kh.trip.dto.MemberGradeDTO;

public interface MemberGradeService {

	MemberGradeName save(MemberGradeDTO memberGradeDTO);

	List<MemberGradeDTO> findAll();

	MemberGradeDTO findById(MemberGradeName gradeName);

	void delete(MemberGradeName gradeName);

	void update(MemberGradeDTO memberGradeDTO);

}
