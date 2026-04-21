package com.kh.trip.domain;

import java.time.LocalDateTime;

import com.kh.trip.domain.common.BaseTimeEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "USER_AUTH_PROVIDERS")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class UserAuthProvider extends BaseTimeEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "seq_user_auth_providers")
	@SequenceGenerator(name = "seq_user_auth_providers", sequenceName = "SEQ_USER_AUTH_PROVIDERS", allocationSize = 1)
	@Column(name = "USER_AUTH_NO")
	private Long userAuthNo;

	@Column(name = "USER_NO", nullable = false)
	private Long userNo;

	@Column(name = "PROVIDER_CODE", nullable = false, length = 20)
	private String providerCode;

	@Column(name = "PROVIDER_USER_ID", length = 200)
	private String providerUserId;

	@Column(name = "LOGIN_ID", length = 100)
	private String loginId;

	@Column(name = "PASSWORD_HASH", length = 255)
	private String passwordHash;

	@Column(name = "CONNECTED_AT", nullable = false)
	private LocalDateTime connectedAt;

	@Column(name = "LAST_LOGIN_AT")
	private LocalDateTime lastLoginAt;

	@PrePersist
	public void prePersistAuth() {
		if (this.connectedAt == null) {
			this.connectedAt = LocalDateTime.now();
		}
	}

	public void changePasswordHash(String passwordHash) {
		this.passwordHash = passwordHash;
	}

}
