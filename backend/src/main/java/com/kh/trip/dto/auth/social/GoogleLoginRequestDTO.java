package com.kh.trip.dto.auth.social;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class GoogleLoginRequestDTO {

	@NotBlank(message = "idToken is required")
	private String idToken;
}
