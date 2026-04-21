package com.kh.trip.service;

import com.kh.trip.dto.HostProfileDTO;
import com.kh.trip.dto.PageRequestDTO;
import com.kh.trip.dto.PageResponseDTO;

public interface HostProfileService {

	Long register(HostProfileDTO hostProfileDTO);

	PageResponseDTO<HostProfileDTO> getList(PageRequestDTO pageRequestDTO);

	HostProfileDTO get(Long hostNo);

	HostProfileDTO getByUserNo(Long userNo);

	void approve(Long hostNo, Long adminUserNo);

	void reject(Long hostNo, Long adminUserNo, String rejectReason);

	void update(Long hostNo, Long userNo, HostProfileDTO hostProfileDTO);

	void delete(Long hostNo);

	void restore(Long hostNo);
}
