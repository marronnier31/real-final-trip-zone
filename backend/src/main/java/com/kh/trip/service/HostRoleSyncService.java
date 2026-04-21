package com.kh.trip.service;

import java.util.LinkedHashSet;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.kh.trip.domain.HostProfile;
import com.kh.trip.domain.UserRole;
import com.kh.trip.domain.enums.HostApprovalStatus;
import com.kh.trip.repository.HostProfileRepository;
import com.kh.trip.repository.UserRoleRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class HostRoleSyncService {

	private static final String HOST_ROLE = "ROLE_HOST";

	private final HostProfileRepository hostProfileRepository;
	private final UserRoleRepository userRoleRepository;

	public List<String> syncAndGetRoleNames(Long userNo) {
		List<UserRole> existingRoles = userRoleRepository.findByUserNo(userNo);
		boolean hasHostRole = existingRoles.stream().anyMatch(role -> HOST_ROLE.equals(role.getRoleCode()));

		boolean shouldHaveHostRole = hostProfileRepository.findByUser_UserNo(userNo)
				.map(this::isApprovedAndEnabled)
				.orElse(false);

		if (shouldHaveHostRole && !hasHostRole) {
			userRoleRepository.save(UserRole.builder().userNo(userNo).roleCode(HOST_ROLE).build());
		} else if (!shouldHaveHostRole && hasHostRole) {
			userRoleRepository.deleteByUserNoAndRoleCode(userNo, HOST_ROLE);
		}

		return userRoleRepository.findByUserNo(userNo).stream()
				.map(UserRole::getRoleCode)
				.collect(java.util.stream.Collectors.toCollection(LinkedHashSet::new))
				.stream()
				.toList();
	}

	private boolean isApprovedAndEnabled(HostProfile hostProfile) {
		return hostProfile.getApprovalStatus() == HostApprovalStatus.APPROVED && "1".equals(hostProfile.getEnabled());
	}
}
