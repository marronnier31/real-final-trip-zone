package com.kh.trip.controller;

import java.util.List;
import java.util.Map;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kh.trip.dto.InquiryMessageDTO;
import com.kh.trip.dto.InquiryRoomDTO;
import com.kh.trip.security.AuthUserPrincipal;
import com.kh.trip.service.InquiryMessageService;
import com.kh.trip.service.InquiryRoomService;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@RestController
@Log4j2
@RequiredArgsConstructor
@RequestMapping("/api/inquiry/room")
public class InquiryRoomController {

	private final InquiryRoomService service;
	private final InquiryMessageService messageService;

    // 채팅방 입장 (기존 방이 있으면 반환, 없으면 생성)
    @PostMapping("/")
    @PreAuthorize("isAuthenticated()")
    public Map<String, Long> save(@AuthenticationPrincipal AuthUserPrincipal authUser, @RequestBody InquiryRoomDTO roomDTO) {
    	// 회원 번호는 토큰에서 고정하고, 프론트는 lodgingNo만 넘겨도 서버가 호스트를 역추적한다.
    	roomDTO.setUserNo(authUser.getUserNo());
        log.info("inquiryRoom save() = " + roomDTO);
        Long roomNo = service.save(roomDTO);
        return Map.of("result", roomNo);
    }
    
    @GetMapping("/me")
    @PreAuthorize("hasRole('USER')")
    public List<InquiryRoomDTO> findMyRooms(@AuthenticationPrincipal AuthUserPrincipal authUser) {
    	 log.info("inquiryRoom findMyRooms() = " + authUser.getUserNo());
        return service.findMyRooms(authUser.getUserNo());
    }

    @GetMapping("/seller")
    @PreAuthorize("hasRole('HOST')")
    public List<InquiryRoomDTO> findSellerRooms(@AuthenticationPrincipal AuthUserPrincipal authUser) {
    	 log.info("inquiryRoom findSellerRooms() = " + authUser.getUserNo());
        return service.findSellerRooms(authUser.getUserNo());
    }
    
    // 이전 메시지 내역 조회
    @GetMapping("/{roomNo}/messages")
    @PreAuthorize("isAuthenticated()")
	public List<InquiryMessageDTO> findByRoomNo(
			@AuthenticationPrincipal AuthUserPrincipal authUser,
			@PathVariable Long roomNo) {
		// 메시지 조회도 로그인 사용자 기준으로 방 참여자 검증을 거친다.
		log.info("inquiryMessage findByRoomNo() = " + roomNo);
		return messageService.findByRoomNo(roomNo, authUser.getUserNo());
	}

    @DeleteMapping("/{roomNo}")
    @PreAuthorize("isAuthenticated()")
    public void delete(@AuthenticationPrincipal AuthUserPrincipal authUser, @PathVariable Long roomNo) {
    	 log.info("inquiryRoom delete() = " + roomNo);
         service.delete(roomNo, authUser.getUserNo());
    }
}
