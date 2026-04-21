package com.kh.trip.dto;

import com.kh.trip.domain.enums.MemberGradeName;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDTO {
	private Long userNo;
	private String userName;
	private String email;
	private String phone;
	private MemberGradeName gradeName;
	private Long mileage;
	private String enabled;

}