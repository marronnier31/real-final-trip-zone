package com.kh.trip.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.kh.trip.domain.enums.RoomStatus;
import com.kh.trip.dto.RoomDTO; 
import com.kh.trip.dto.HostProfileDTO;
import com.kh.trip.security.AuthUserPrincipal;
import com.kh.trip.service.HostProfileService;
import com.kh.trip.service.LodgingService;
import com.kh.trip.service.RoomService;

import lombok.RequiredArgsConstructor;

@RequestMapping("/api/rooms")
@RestController
@RequiredArgsConstructor
public class RoomController {

	private final RoomService roomService;
	private final HostProfileService hostProfileService;
	private final LodgingService lodgingService;

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	@PreAuthorize("hasAnyRole('HOST', 'ADMIN')")
	public RoomDTO createRoom(@AuthenticationPrincipal AuthUserPrincipal authUser, @RequestBody RoomDTO roomDTO) {
		verifyLodgingOwnership(authUser, roomDTO.getLodgingNo());
		return roomService.createRoom(roomDTO); 
	}

	@GetMapping("/lodging/{lodgingNo}")
	public List<RoomDTO> getRoomsByLodgingNo(@PathVariable Long lodgingNo) { 
		return roomService.getRoomsByLodgingNo(lodgingNo); 
	}

	@GetMapping("/{roomNo}")
	public RoomDTO getRoomDetail(@PathVariable Long roomNo) { 
		return roomService.getRoomDetail(roomNo); 
	}

	@PatchMapping("/{roomNo}")
	@PreAuthorize("hasAnyRole('HOST', 'ADMIN')")
	public RoomDTO updateRoom(@PathVariable Long roomNo, @AuthenticationPrincipal AuthUserPrincipal authUser,
			@RequestBody RoomDTO roomDTO) {
		verifyRoomOwnership(authUser, roomNo);
		if (roomDTO.getLodgingNo() != null) {
			verifyLodgingOwnership(authUser, roomDTO.getLodgingNo());
		}
		return roomService.updateRoom(roomNo, roomDTO); 
	}

	@DeleteMapping("/{roomNo}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	@PreAuthorize("hasAnyRole('HOST', 'ADMIN')")
	public void deleteRoom(@PathVariable Long roomNo, @AuthenticationPrincipal AuthUserPrincipal authUser) {
		verifyRoomOwnership(authUser, roomNo);
		roomService.deleteRoom(roomNo);
	}

	@GetMapping
	public List<RoomDTO> getAllRooms() { 
		return roomService.getAllRooms(); 
	}

	@GetMapping("/status/{status}")
	public List<RoomDTO> getRoomsByStatus(@PathVariable RoomStatus status) { 
		return roomService.getRoomsByStatus(status); 
	}

	@GetMapping("/search")
	public List<RoomDTO> searchRoomsByName(@RequestParam String keyword) {
		return roomService.searchRoomsByName(keyword); 
	}

	@GetMapping("/lodging/{lodgingNo}/status/{status}")
	public List<RoomDTO> getRoomsByLodgingNoAndStatus(@PathVariable Long lodgingNo,
			@PathVariable RoomStatus status) { 
		return roomService.getRoomsByLodgingNoAndStatus(lodgingNo, status); 
	}

	private void verifyRoomOwnership(AuthUserPrincipal authUser, Long roomNo) {
		if (isAdmin(authUser)) {
			return;
		}

		RoomDTO room = roomService.getRoomForManagement(roomNo);
		verifyLodgingOwnership(authUser, room.getLodgingNo());
	}

	private void verifyLodgingOwnership(AuthUserPrincipal authUser, Long lodgingNo) {
		if (isAdmin(authUser)) {
			return;
		}

		if (lodgingNo == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "숙소 번호는 필수입니다.");
		}

		HostProfileDTO hostProfile = requireHostProfile(authUser);
		boolean ownsLodging = lodgingService.getLodgingsByHostNo(hostProfile.getHostNo()).stream()
				.anyMatch(item -> lodgingNo.equals(item.getLodgingNo()));

		if (!ownsLodging) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "본인 숙소의 객실만 관리할 수 있습니다.");
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
