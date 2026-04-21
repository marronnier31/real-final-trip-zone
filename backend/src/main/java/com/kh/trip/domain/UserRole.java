package com.kh.trip.domain;

import com.kh.trip.domain.common.BaseTimeEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "USER_ROLES", uniqueConstraints = {
		@UniqueConstraint(name = "UK_USER_ROLES_USER_NO_ROLE_CODE", columnNames = { "USER_NO", "ROLE_CODE" }) })
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class UserRole extends BaseTimeEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "seq_user_roles")
	@SequenceGenerator(name = "seq_user_roles", sequenceName = "SEQ_USER_ROLES", allocationSize = 1)
	@Column(name = "USER_ROLE_NO")
	private Long userRoleNo;

	@Column(name = "USER_NO", nullable = false)
	private Long userNo;

	@Column(name = "ROLE_CODE", nullable = false, length = 30)
	private String roleCode;

}
