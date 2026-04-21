package com.kh.trip.dto.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LoginRequestDTO {
	@NotBlank(message = "loginId is required")
	private String loginId;

	@NotBlank(message = "password is required")
	private String password;
}
