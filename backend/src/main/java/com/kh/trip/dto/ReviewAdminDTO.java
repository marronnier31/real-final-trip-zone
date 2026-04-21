package com.kh.trip.dto;

import java.time.LocalDateTime;

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
public class ReviewAdminDTO {

	private Long reviewNo;
	private Long lodgingNo;
	private String lodgingName;
	private Long userNo;
	private String userName;
	private Integer rating;
	private String content;
	private String status;
	private LocalDateTime regDate;
}
