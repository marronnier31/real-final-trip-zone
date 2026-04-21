package com.kh.trip.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class WithdrawRequestDTO {
	 @NotBlank
	    private String reason;
}
