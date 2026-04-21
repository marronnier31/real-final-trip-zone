package com.kh.trip.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ChangePasswordRequestDTO {

	@NotBlank(message = "새 비밀번호는 필수입니다.")
	@Size(min = 4, max = 20, message = "비밀번호는 4자 이상 20자 이하입니다.")
	private String newPassword;
	@NotBlank(message = "비밀번호 확인은 필수입니다.")
	private String newPasswordConfirm;
}
