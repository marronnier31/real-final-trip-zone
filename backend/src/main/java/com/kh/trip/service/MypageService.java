package com.kh.trip.service;

import com.kh.trip.dto.CodeLabelValueDTO;
import com.kh.trip.dto.PageRequestDTO;
import com.kh.trip.dto.PageResponseDTO;
import com.kh.trip.dto.UserDTO;

public interface MypageService {

    UserDTO getProfile(Long userNo);

    CodeLabelValueDTO getMileage(Long userNo);

    PageResponseDTO<CodeLabelValueDTO> getMileageHistory(Long userNo, PageRequestDTO pageRequestDTO);
}
