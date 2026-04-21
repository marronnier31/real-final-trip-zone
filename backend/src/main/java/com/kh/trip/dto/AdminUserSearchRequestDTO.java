package com.kh.trip.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

@Getter
@Setter
@NoArgsConstructor
@SuperBuilder
public class AdminUserSearchRequestDTO extends PageRequestDTO {
	private String type; // name, email, all
	private String keyword; // 검색어
	// 회원 상태 필터: "1"(활성), "0"(탈퇴), "all"(전체)
	private String enabled;
}
