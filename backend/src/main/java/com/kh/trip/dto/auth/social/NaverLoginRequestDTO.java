package com.kh.trip.dto.auth.social;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class NaverLoginRequestDTO {

	@NotBlank(message = "code is required")
	private String code;

	@NotBlank(message = "state is required")
	private String state;
}
