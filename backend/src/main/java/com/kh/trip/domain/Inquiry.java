package com.kh.trip.domain;

import com.kh.trip.domain.common.BaseTimeEntity;
import com.kh.trip.domain.enums.InquiryStatus;
import com.kh.trip.domain.enums.InquiryType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "INQUIRIES")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Inquiry extends BaseTimeEntity {
	@Id
	@GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "seq_inquiries")
	@SequenceGenerator(name = "seq_inquiries", sequenceName = "SEQ_INQUIRIES", allocationSize = 1)
	@Column(name = "INQUIRY_NO")
	private Long inquiryNo;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "USER_NO", nullable = false)
	private User user;

	@Enumerated(EnumType.STRING)
	@Column(name = "INQUIRY_TYPE", nullable = false)
	private InquiryType inquiryType;

	@Column(name = "TITLE", nullable = false, length = 300)
	private String title;

	@Lob
	@Column(name = "CONTENT", nullable = false, length = 3000)
	private String content;

	@Enumerated(EnumType.STRING)
	@Builder.Default
	@Column(name = "STATUS", nullable = false)
	private InquiryStatus status = InquiryStatus.PENDING;

	@Column(name = "RELATED_BOOKING_NO", length = 40)
	private String relatedBookingNo;

	@Column(name = "RELATED_LODGING_NAME", length = 200)
	private String relatedLodgingName;

	public void changeTitle(String title) {
		this.title = title;
	}

	public void changeInquiryType(InquiryType inquiryType) {
		this.inquiryType = inquiryType;
	}

	public void changeContent(String content) {
		this.content = content;
	}

	public void changeStatus(InquiryStatus status) {
		this.status = status;
	}

	public void changeRelatedBookingNo(String relatedBookingNo) {
		this.relatedBookingNo = relatedBookingNo;
	}

	public void changeRelatedLodgingName(String relatedLodgingName) {
		this.relatedLodgingName = relatedLodgingName;
	}

}
