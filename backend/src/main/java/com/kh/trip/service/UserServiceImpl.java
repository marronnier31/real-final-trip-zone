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

import com.kh.trip.domain.User;
import com.kh.trip.domain.UserRefreshToken;
import com.kh.trip.dto.AdminUserSearchRequestDTO;
import com.kh.trip.dto.PageResponseDTO;
import com.kh.trip.dto.UserDTO;
import com.kh.trip.dto.UserUpdateRequestDTO;
import com.kh.trip.repository.UserRefreshTokenRepository;
import com.kh.trip.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class UserServiceImpl implements UserService {

	private final UserRepository userRepository;
	private final UserRefreshTokenRepository userRefreshTokenRepository;

	@Override
	public UserDTO getUser(Long userNo) {
		User user = userRepository.findById(userNo)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다."));

		return entityToDTO(user);
	}

	private UserDTO entityToDTO(User user) {
		return UserDTO.builder().userNo(user.getUserNo()).userName(user.getUserName()).email(user.getEmail())
				.phone(user.getPhone())
				.gradeName(user.getMemberGrade() != null ? user.getMemberGrade().getGradeName() : null)
				.mileage(user.getMileage()).enabled(user.getEnabled()).build();
	}

	@Override
	public void delete(Long userNo) {
		User user = userRepository.findById(userNo)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다."));

		if ("0".equals(user.getEnabled())) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 탈퇴 처리된 사용자입니다.");
		}
		List<UserRefreshToken> refreshTokens = userRefreshTokenRepository.findByUserNo(userNo);
		refreshTokens.stream().filter(token -> "0".equals(token.getRevokedYn())).forEach(UserRefreshToken::revoke);

		userRefreshTokenRepository.saveAll(refreshTokens);

		user.changeEnabled("0");
		userRepository.save(user);
	}

	@Override
	public void update(Long userNo, UserUpdateRequestDTO request) {
		User user = userRepository.findById(userNo)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다."

				));

		if (request.getPhone() != null && !request.getPhone().isBlank()) {

			user.changePhone(request.getPhone());
		}
		userRepository.save(user);
	}

	@Override
	public PageResponseDTO<UserDTO> findUsers(AdminUserSearchRequestDTO request) {
		int page = request.getPage() <= 0 ? 1 : request.getPage();
		int size = request.getSize() <= 0 ? 10 : request.getSize();

		Pageable pageable = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "userNo"));

		String type = request.getType() == null ? "all" : request.getType().trim().toLowerCase();
		if (!type.equals("name") && !type.equals("email") && !type.equals("all")) {
			type = "all";
		}

		String keyword = request.getKeyword() == null ? "" : request.getKeyword().trim();

		// 0(탈퇴), 1(활성), all(전체)
		String enabled = request.getEnabled() == null ? "all" : request.getEnabled().trim().toLowerCase();
		if (!enabled.equals("0") && !enabled.equals("1") && !enabled.equals("all")) {
			enabled = "all";
		}

		Page<User> result = userRepository.searchUsers(type, keyword, enabled, pageable);

		List<UserDTO> dtoList = result.stream().map(this::entityToDTO).toList();
		return PageResponseDTO.<UserDTO>withAll().dtoList(dtoList).pageRequestDTO(request)
				.totalCount(result.getTotalElements()).build();
	}

	@Override
	public void restore(Long userNo) {
		User user = userRepository.findById(userNo)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다."));

		if ("1".equals(user.getEnabled())) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 활성화된 사용자입니다.");
		}

		user.changeEnabled("1");
		userRepository.save(user);
	}
}
