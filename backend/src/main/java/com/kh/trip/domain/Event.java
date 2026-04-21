package com.kh.trip.domain;

import java.time.LocalDateTime;

import com.kh.trip.domain.common.BaseTimeEntity;
import com.kh.trip.domain.enums.EventStatus;

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
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "EVENTS")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Event extends BaseTimeEntity {
	@Id
	@GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "seq_events")
	@SequenceGenerator(name = "seq_events", sequenceName = "SEQ_EVENTS", allocationSize = 1)
	@Column(name = "EVENT_NO")
	private Long eventNo;

	@ManyToOne(fetch = FetchType.LAZY) // 외래키
	@JoinColumn(name = "ADMIN_USER_NO", nullable = false)
	private User adminUser;

	@Column(name = "TITLE", nullable = false)
	private String title;

	@Lob
	@Column(name = "CONTENT", nullable = false)
	private String content;

	@Column(name = "THUMBNAIL_URL")
	private String thumbnailUrl;

	@Column(name = "START_DATE", nullable = false)
	private LocalDateTime startDate;

	@Column(name = "END_DATE", nullable = false)
	private LocalDateTime endDate;

	@Enumerated(EnumType.STRING)
	@Column(name = "EVENT_STATUS", nullable = false)
	@Builder.Default
	private EventStatus status = EventStatus.DRAFT;

	@PositiveOrZero
	@Column(name = "VIEW_COUNT", nullable = false)
	private Long viewCount;

	@PrePersist
	@PreUpdate
	public void validateDates() {
		if (startDate != null && endDate != null) {
			if (!endDate.isAfter(startDate)) {
				throw new IllegalStateException("종료 일시는 시작 일시보다 최소 1초 이상 뒤여야 합니다.");
			}
		}
	}
	// 제목 수정용 메서드
	public void changeTitle(String title) {
		this.title = title;
	}
	// 내용 수정용 메서드
	public void changeContent(String content) {
		this.content = content;
	}
	// 썸네일 URL 수정용 메서드
	public void changeThumbnailUrl(String thumbnailUrl) {
		this.thumbnailUrl = thumbnailUrl;
	}
	
	public void changeStatus(EventStatus status) {
		this.status = status;
	}

	public void changeViewCount(Long viewCount) {
		this.viewCount = viewCount;
	}
	public void changeStartDate (LocalDateTime startDate) {
		this.startDate = startDate;
	}
	public void changeEndDate (LocalDateTime endDate) {
		this.endDate = endDate;
	}
}
