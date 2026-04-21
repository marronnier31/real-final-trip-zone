package com.kh.trip.dto.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LogoutRequestDTO {

	@NotBlank(message = "refreshToken is required")
	private String refreshToken;
}
