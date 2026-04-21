package com.kh.trip.dto;

import java.time.LocalDateTime;

import com.kh.trip.domain.enums.InquiryRoomStatus;

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
public class InquiryRoomDTO {
	private Long inquiryRoomNo;
	private Long userNo;
	private Long hostNo;
	private Long lodgingNo;
	private Long bookingNo;
	private InquiryRoomStatus status;
	private String lodgingName;
	private String hostName;
	private String lastMessage;
	private LocalDateTime regDate;
	private LocalDateTime updDate;
}
