package com.kh.trip.service;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.kh.trip.domain.HostProfile;
import com.kh.trip.domain.User;
import com.kh.trip.domain.enums.HostApprovalStatus;
import com.kh.trip.dto.HostProfileDTO;
import com.kh.trip.dto.PageRequestDTO;
import com.kh.trip.dto.PageResponseDTO;
import com.kh.trip.repository.HostProfileRepository;
import com.kh.trip.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class HostProfileServiceImpl implements HostProfileService {

	private final HostProfileRepository hostProfileRepository;
	private final UserRepository userRepository;
	private final HostRoleSyncService hostRoleSyncService;

	@Override
	public Long register(HostProfileDTO hostProfileDTO) {
		if (hostProfileRepository.existsByUser_UserNo(hostProfileDTO.getUserNo())) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 호스트 프로필이 등록된 사용자입니다.");
		}
		if (hostProfileRepository.existsByBusinessNumber(hostProfileDTO.getBusinessNumber())) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 등록된 사업자등록번호입니다.");
		}

		HostProfile hostProfile = dtoToEntity(hostProfileDTO);
		HostProfile savedHostProfile = hostProfileRepository.save(hostProfile);
		return savedHostProfile.getHostNo();
	}

	@Override
	public PageResponseDTO<HostProfileDTO> getList(PageRequestDTO pageRequestDTO) {
		Pageable pageable = PageRequest.of(pageRequestDTO.getPage() - 1, pageRequestDTO.getSize(),
				Sort.by("hostNo").descending());

		Page<HostProfile> result = hostProfileRepository.findAll(pageable);

		List<HostProfileDTO> dtoList = result.stream().map(this::entityToDTO).toList();

		return PageResponseDTO.<HostProfileDTO>withAll().dtoList(dtoList).pageRequestDTO(pageRequestDTO)
				.totalCount(result.getTotalElements()).build();
	}

	@Override
	public HostProfileDTO get(Long hostNo) {
		HostProfile hostProfile = hostProfileRepository.findById(hostNo)
				.orElseThrow(() -> new IllegalArgumentException("존재하지 않는 호스트 프로필 입니다."));
		return entityToDTO(hostProfile);
	}

	@Override
	public HostProfileDTO getByUserNo(Long userNo) {
		return hostProfileRepository.findByUser_UserNo(userNo).map(this::entityToDTO).orElse(null);
	}

	@Override
	public void approve(Long hostNo, Long adminUserNo) {
		HostProfile hostProfile = hostProfileRepository.findById(hostNo)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "존재하지 않는 호스트 프로필 입니다."));
		if (hostProfile.getApprovalStatus() != HostApprovalStatus.PENDING) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "대기 상태의 호스트 프로필만 승인할 수 있습니다.");
		}
		hostProfile.approve(adminUserNo);
		hostProfileRepository.save(hostProfile);
		hostRoleSyncService.syncAndGetRoleNames(hostProfile.getUser().getUserNo());
	}

	@Override
	public void reject(Long hostNo, Long adminUserNo, String rejectReason) {
		HostProfile hostProfile = hostProfileRepository.findById(hostNo)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "존재하지 않는 호스트 프로필 입니다."));

		if (hostProfile.getApprovalStatus() != HostApprovalStatus.PENDING) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "대기 상태의 호스트 프로필만 반려할 수 있습니다.");
		}
		hostProfile.reject(adminUserNo, rejectReason);
		hostProfileRepository.save(hostProfile);
		hostRoleSyncService.syncAndGetRoleNames(hostProfile.getUser().getUserNo());
	}

	@Override
	public void update(Long hostNo, Long userNo, HostProfileDTO hostProfileDTO) {
		HostProfile hostProfile = hostProfileRepository.findById(hostNo)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "호스트 신청 정보가 없습니다."));

		if (!hostProfile.getUser().getUserNo().equals(userNo)) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "본인 신청만 수정할 수 있습니다.");
		}

		if (hostProfile.getApprovalStatus() != HostApprovalStatus.REJECTED) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "반려된 신청만 수정 후 재신청할 수 있습니다.");
		}

		if (!hostProfile.getBusinessNumber().equals(hostProfileDTO.getBusinessNumber())
				&& hostProfileRepository.existsByBusinessNumber(hostProfileDTO.getBusinessNumber())) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 등록된 사업자등록번호입니다.");
		}

		hostProfile.updateForResubmit(hostProfileDTO.getBusinessName(), hostProfileDTO.getBusinessNumber(),
				hostProfileDTO.getOwnerName(), hostProfileDTO.getAccount());

		hostProfileRepository.save(hostProfile);
	}

	@Override
	public void delete(Long hostNo) {
		HostProfile hostProfile = hostProfileRepository.findById(hostNo)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "존재하지 않는 호스트 프로필 입니다."));
		if (hostProfile.getEnabled().equals("0")) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 비활성화 된 사업자정보입니다.");
		}
		hostProfile.changeEnabled("0");
		hostProfileRepository.save(hostProfile);
		hostRoleSyncService.syncAndGetRoleNames(hostProfile.getUser().getUserNo());
	}

	@Override
	public void restore(Long hostNo) {
		HostProfile hostProfile = hostProfileRepository.findById(hostNo)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "존재하지 않는 호스트 프로필 입니다."));
		if (hostProfile.getEnabled().equals("1")) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 사용중인 사업자정보입니다.");
		}
		hostProfile.changeEnabled("1");
		hostProfileRepository.save(hostProfile);
		hostRoleSyncService.syncAndGetRoleNames(hostProfile.getUser().getUserNo());
	}

	private HostProfile dtoToEntity(HostProfileDTO hostProfileDTO) {
		User user = userRepository.findById(hostProfileDTO.getUserNo())
				.orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원입니다. userNo=" + hostProfileDTO.getUserNo()));

		return HostProfile.builder().user(user).businessName(hostProfileDTO.getBusinessName())
				.businessNumber(hostProfileDTO.getBusinessNumber()).ownerName(hostProfileDTO.getOwnerName())
				.account(hostProfileDTO.getAccount()).approvalStatus(HostApprovalStatus.PENDING).build();

	}

	private HostProfileDTO entityToDTO(HostProfile hostProfile) {
		return HostProfileDTO.builder().hostNo(hostProfile.getHostNo()).userNo(hostProfile.getUser().getUserNo())
				.businessName(hostProfile.getBusinessName()).businessNumber(hostProfile.getBusinessNumber())
				.ownerName(hostProfile.getOwnerName()).account(hostProfile.getAccount())
				.approvalStatus(hostProfile.getApprovalStatus().name()).rejectReason(hostProfile.getRejectReason())
				.enabled(hostProfile.getEnabled())
				.regDate(hostProfile.getRegDate() != null ? hostProfile.getRegDate().toString() : null)
				.updDate(hostProfile.getUpdDate() != null ? hostProfile.getUpdDate().toString() : null).build();
	}

}
