package com.kh.trip.controller;

import java.security.Principal;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

import com.kh.trip.dto.InquiryMessageDTO;
import com.kh.trip.security.AuthUserPrincipal;
import com.kh.trip.service.InquiryMessageService;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@Controller
@RequiredArgsConstructor
@Log4j2
@RequestMapping("/api/inquiry")
public class InquiryMessageController {

	private final InquiryMessageService service;
	private final SimpMessagingTemplate messagingTemplate;

	@MessageMapping("/inquiry/{roomNo}/send")
	public void sendMessage(@DestinationVariable Long roomNo, @Payload InquiryMessageDTO messageDTO, Principal principal) {
		if (!(principal instanceof org.springframework.security.core.Authentication authentication)
				|| !(authentication.getPrincipal() instanceof AuthUserPrincipal authUser)) {
			throw new IllegalArgumentException("웹소켓 인증 정보가 없습니다.");
		}

		// roomNo는 destination에서, senderNo는 WebSocket 인증 사용자에서 강제한다.
		// 프론트가 발신자를 임의 조작하지 못하게 하기 위한 처리다.
		messageDTO.setInquiryRoomNo(roomNo);
		messageDTO.setSenderNo(authUser.getUserNo());
		log.info("inquiryMessage sendMessage() = " + messageDTO);
		InquiryMessageDTO savedMessage = service.save(messageDTO);
		// 같은 room topic을 구독 중인 회원/판매자 화면으로 저장된 메시지를 즉시 push한다.
		messagingTemplate.convertAndSend("/topic/inquiry/" + savedMessage.getInquiryRoomNo(), savedMessage);
	}

}
