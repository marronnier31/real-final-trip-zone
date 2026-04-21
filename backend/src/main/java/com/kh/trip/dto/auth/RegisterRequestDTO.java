package com.kh.trip.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RegisterRequestDTO {

	@NotBlank(message = "loginId is required")
	@Size(min = 4, max = 20, message = "loginId must be between 4 and 20 characters")
	private String loginId;

	@NotBlank(message = "password is required")
	@Size(min = 4, max = 20, message = "password must be between 4 and 20 characters")
	private String password;

	@NotBlank(message = "userName is required")
	@Size(max = 100, message = "userName must be 100 characters or less")
	private String userName;

	@NotBlank(message = "email is required")
	@Email(message = "email format is invalid")
	private String email;

	@NotBlank(message = "phone is required")
	private String phone;
}
