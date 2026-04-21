package com.kh.trip.domain;

import java.time.LocalDateTime;

import com.kh.trip.domain.common.BaseTimeEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@Table(name = "USER_REFRESH_TOKENS")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class UserRefreshToken extends BaseTimeEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "seq_user_refresh_tokens")
	@SequenceGenerator(name = "seq_user_refresh_tokens", sequenceName = "SEQ_USER_REFRESH_TOKENS", allocationSize = 1)
	@Column(name = "REFRESH_TOKEN_NO")
	private Long refreshTokenNo;

	@Column(name = "USER_NO", nullable = false)
	private Long userNo;

	@Column(name = "TOKEN_VALUE", nullable = false, length = 500, unique = true)
	private String tokenValue;

	@Column(name = "EXPIRES_AT", nullable = false)
	private LocalDateTime expiresAt;

	@Builder.Default
	@Column(name = "REVOKED_YN", nullable = false, length = 1)
	private String revokedYn = "0";

	@Column(name = "REVOKED_AT")
	private LocalDateTime revokedAt;

	public void revoke() {
		this.revokedYn = "1";
		this.revokedAt = LocalDateTime.now();
	}
}
