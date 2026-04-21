package com.kh.trip.domain;

import com.kh.trip.domain.common.BaseTimeEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(name = "COMMENTS")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Comment extends BaseTimeEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "seq_comments")
	@SequenceGenerator(name = "seq_comments", sequenceName = "SEQ_COMMENTS", allocationSize = 1)
	@Column(name = "COMMENT_NO")
	private Long commentNo;

	@ManyToOne(fetch = FetchType.LAZY) // 외래키
	@JoinColumn(name = "INQUIRY_NO", nullable = false)
	private Inquiry inquiry;

	@ManyToOne(fetch = FetchType.LAZY) // 외래키
	@JoinColumn(name = "ADMIN_NO", nullable = false)
	private User user;

	@Lob
	@Column(name = "CONTENT", nullable = false)
	private String content;

	public void changeContent(String content) {
		this.content = content;
	}
}
