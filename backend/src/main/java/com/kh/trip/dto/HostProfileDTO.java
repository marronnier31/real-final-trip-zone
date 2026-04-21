package com.kh.trip.dto;

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
public class HostProfileDTO {

	private Long hostNo;
	private Long userNo;
	private String businessName;
	private String businessNumber;
	private String ownerName;
	private String account;
	private String approvalStatus;
	private String rejectReason;
	private String enabled;
	private String regDate;
	private String updDate;
}
