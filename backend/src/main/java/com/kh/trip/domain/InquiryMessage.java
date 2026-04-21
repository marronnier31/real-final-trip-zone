package com.kh.trip.domain;

import com.kh.trip.domain.common.BaseTimeEntity;
import com.kh.trip.domain.enums.SenderType;

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
@Table(name = "INQUIRY_MESSAGES")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class InquiryMessage extends BaseTimeEntity {
	@Id
	@GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "seq_inquiry_messages")
	@SequenceGenerator(name = "seq_inquiry_messages", sequenceName = "SEQ_INQUIRY_MESSAGES", allocationSize = 1)
	@Column(name = "MESSAGE_NO")
	private Long messageNo;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "INQUIRY_ROOM_NO", nullable = false)
	private InquiryRoom inquiryRoom;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "SENDER_NO", nullable = false)
	private User user;

	@Enumerated(EnumType.STRING)
	@Column(name = "SENDER_TYPE", nullable = false)
	private SenderType senderType;

	@Column(name = "CONTENT", nullable = false)
	private String content;
}
