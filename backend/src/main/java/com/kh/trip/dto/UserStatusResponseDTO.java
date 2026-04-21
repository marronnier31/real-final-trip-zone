package com.kh.trip.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserStatusResponseDTO {
	private Long userId;
    private String name;
    private String email;
    private String status;
}
