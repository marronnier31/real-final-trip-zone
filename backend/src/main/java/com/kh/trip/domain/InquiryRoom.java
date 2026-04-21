package com.kh.trip.domain;

import com.kh.trip.domain.common.BaseTimeEntity;
import com.kh.trip.domain.enums.InquiryRoomStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "INQUIRY_ROOMS")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class InquiryRoom extends BaseTimeEntity {
	@Id
	@GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "seq_inquiry_rooms")
	@SequenceGenerator(name = "seq_inquiry_rooms", sequenceName = "SEQ_INQUIRY_ROOMS", allocationSize = 1)
	@Column(name = "INQUIRY_ROOM_NO")
	private Long inquiryRoomNo;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "USER_NO", nullable = false)
	private User user;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "HOST_NO", nullable = false)
	private HostProfile host;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "LODGING_NO", nullable = false)
	private Lodging lodging;

	@Column(name = "BOOKING_NO")
	private Long bookingNo;
	
	@Enumerated(EnumType.STRING)
	@Column(name = "STATUS", nullable = false)
	@Builder.Default
	private InquiryRoomStatus status = InquiryRoomStatus.OPEN;

	public void changeStatus(InquiryRoomStatus status) {
		this.status = status;
	}
	
	public void changeBookingNo(Long bookingNo) {
		this.bookingNo = bookingNo;
	}
}
