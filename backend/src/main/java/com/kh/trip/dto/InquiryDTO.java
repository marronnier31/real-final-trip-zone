package com.kh.trip.dto;

import java.time.LocalDateTime;

import com.kh.trip.domain.enums.InquiryStatus;
import com.kh.trip.domain.enums.InquiryType;

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
public class InquiryDTO {
	private Long inquiryNo;
	private Long userNo;
	private String title;
	private InquiryType inquiryType;
	private String content;
	private InquiryStatus status;
	private String bookingNo;
	private String lodging;
	private LocalDateTime regDate;
	private LocalDateTime updDate;
}
