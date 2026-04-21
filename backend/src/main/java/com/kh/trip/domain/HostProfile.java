package com.kh.trip.domain;

import java.time.LocalDateTime;

import com.kh.trip.domain.common.BaseTimeEntity;
import com.kh.trip.domain.enums.HostApprovalStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "HOST_PROFILES")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class HostProfile extends BaseTimeEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "seq_host_profiles")
	@SequenceGenerator(name = "seq_host_profiles", sequenceName = "SEQ_HOST_PROFILES", allocationSize = 1)
	@Column(name = "HOST_NO")
	private Long hostNo;

	@OneToOne
	@JoinColumn(name = "USER_NO", nullable = false, unique = true)
	private User user;

	@Column(name = "BUSINESS_NAME", nullable = false, length = 100)
	private String businessName;

	@Column(name = "BUSINESS_NUMBER", nullable = false, length = 50, unique = true)
	private String businessNumber;

	@Column(name = "OWNER_NAME", nullable = false, length = 100)
	private String ownerName;

	@Column(name = "ACCOUNT", nullable = false, length = 200)
	private String account;

	@Builder.Default
	@Enumerated(EnumType.STRING)
	@Column(name = "APPROVAL_STATUS", nullable = false, length = 20)
	private HostApprovalStatus approvalStatus = HostApprovalStatus.PENDING;

	@Column(name = "APPROVED_BY")
	private Long approvedBy;

	@Column(name = "APPROVED_AT")
	private LocalDateTime approvedAt;

	@Column(name = "REJECT_REASON", length = 300)
	private String rejectReason;

	@Builder.Default
	@Column(name = "ENABLED", nullable = false, length = 1)
	private String enabled = "1";

	public void changeEnabled(String enabled) {
		this.enabled = enabled;
	}

	public void approve(Long adminUserNo) {
		this.approvalStatus = HostApprovalStatus.APPROVED;
		this.approvedBy = adminUserNo;
		this.approvedAt = LocalDateTime.now();
		this.rejectReason = null;
	}

	public void reject(Long adminUserNo, String rejectReason) {
		this.approvalStatus = HostApprovalStatus.REJECTED;
		this.approvedBy = adminUserNo;
		this.approvedAt = LocalDateTime.now();
		this.rejectReason = rejectReason;
	}

	public void updateForResubmit(String businessName, String businessNumber, String ownerName, String account) {
		this.businessName = businessName;
		this.businessNumber = businessNumber;
		this.ownerName = ownerName;
		this.account = account;
		this.approvalStatus = HostApprovalStatus.PENDING;
		this.approvedBy = null;
		this.approvedAt = null;
		this.rejectReason = null;
	}
}