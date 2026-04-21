package com.kh.trip.controller;

import java.util.List;

import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.kh.trip.dto.LodgingDTO;
import com.kh.trip.dto.PageRequestDTO;
import com.kh.trip.dto.PageResponseDTO;
import com.kh.trip.dto.HostProfileDTO;
import com.kh.trip.security.AuthUserPrincipal;
import com.kh.trip.service.HostProfileService;
import com.kh.trip.service.LodgingService;
import com.kh.trip.util.CustomFileUtil;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/lodgings")
@RequiredArgsConstructor
public class LodgingController {

	private final LodgingService lodgingService;
	private final HostProfileService hostProfileService;
	private final CustomFileUtil fileUtil;

	@PostMapping("/")
	@ResponseStatus(HttpStatus.CREATED)
	@PreAuthorize("hasAnyRole('HOST', 'ADMIN')")
	public LodgingDTO createLodging(@AuthenticationPrincipal AuthUserPrincipal authUser,
			@ModelAttribute LodgingDTO lodgingDTO) {
		if (!isAdmin(authUser)) {
			HostProfileDTO hostProfile = requireHostProfile(authUser);
			lodgingDTO.setHostNo(hostProfile.getHostNo());
		} else if (lodgingDTO.getHostNo() == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "관리자 등록은 hostNo가 필요합니다.");
		}
		return lodgingService.createLodging(lodgingDTO);
	}

	@GetMapping("/view/{fileName}")
	public ResponseEntity<Resource> viewFileGET(@PathVariable String fileName) {
		return fileUtil.getFile(fileName);
	}

	@GetMapping("/{lodgingNo}")
	public LodgingDTO getLodging(@PathVariable Long lodgingNo) {
		return lodgingService.getLodging(lodgingNo);
	}

	@GetMapping("/list")
	public List<LodgingDTO> getAllLodgings() {
		return lodgingService.getAllLodgings();
	}

	@GetMapping("/page")
	public PageResponseDTO<LodgingDTO> getAllLodgings(PageRequestDTO pageRequestDTO) {
		return lodgingService.getAllLodgings(pageRequestDTO);
	}

	@GetMapping("/region")
	public List<LodgingDTO> getLodgingsByRegion(@RequestParam String region) {
		return lodgingService.getLodgingsByRegion(region);
	}

	@GetMapping("/search")
	public List<LodgingDTO> searchLodgingsByName(@RequestParam String keyword) {
		return lodgingService.searchLodgingsByName(keyword);
	}

	@PatchMapping("/{lodgingNo}")
	@PreAuthorize("hasAnyRole('HOST', 'ADMIN')")
	public LodgingDTO updateLodging(@PathVariable Long lodgingNo,
			@AuthenticationPrincipal AuthUserPrincipal authUser,
			@ModelAttribute LodgingDTO lodgingDTO) {
		verifyLodgingOwnership(authUser, lodgingNo);
		lodgingDTO.setLodgingNo(lodgingNo);
		return lodgingService.updateLodging(lodgingNo, lodgingDTO);
	}

	@DeleteMapping("/{lodgingNo}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	@PreAuthorize("hasAnyRole('HOST', 'ADMIN')")
	public void deleteLodging(@PathVariable Long lodgingNo,
			@AuthenticationPrincipal AuthUserPrincipal authUser) {
		verifyLodgingOwnership(authUser, lodgingNo);
		lodgingService.deleteLodging(lodgingNo);
	}

	@GetMapping("/{lodgingNo}/detail") // 상세보기 전용 API
	public LodgingDTO getLodgingDetail(@PathVariable Long lodgingNo) {
		return lodgingService.getLodgingDetail(lodgingNo); // 상세 DTO 반환
	}

	private void verifyLodgingOwnership(AuthUserPrincipal authUser, Long lodgingNo) {
		if (isAdmin(authUser)) {
			return;
		}

		HostProfileDTO hostProfile = requireHostProfile(authUser);
		boolean ownsLodging = lodgingService.getLodgingsByHostNo(hostProfile.getHostNo()).stream()
				.anyMatch(item -> lodgingNo.equals(item.getLodgingNo()));

		if (!ownsLodging) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "본인 숙소만 수정할 수 있습니다.");
		}
	}

	private HostProfileDTO requireHostProfile(AuthUserPrincipal authUser) {
		HostProfileDTO hostProfile = hostProfileService.getByUserNo(authUser.getUserNo());
		if (hostProfile == null) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "판매자 정보를 찾을 수 없습니다.");
		}
		return hostProfile;
	}

	private boolean isAdmin(AuthUserPrincipal authUser) {
		return authUser != null && authUser.getRoleNames() != null && authUser.getRoleNames().contains("ROLE_ADMIN");
	}

}
