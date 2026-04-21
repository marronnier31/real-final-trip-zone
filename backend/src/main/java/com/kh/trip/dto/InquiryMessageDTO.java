package com.kh.trip.dto;

import java.time.LocalDateTime;

import com.kh.trip.domain.enums.SenderType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InquiryMessageDTO {
	private Long messageNo;
	private Long inquiryRoomNo;
	private Long senderNo;
	private SenderType senderType;
	private String senderName;
	private String content;
	private LocalDateTime regDate;
}
