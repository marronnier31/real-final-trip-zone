package com.kh.trip.domain;

import com.kh.trip.domain.common.BaseTimeEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(name = "ROOM_IMAGES")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class RoomImage extends BaseTimeEntity{

	@Id
	@GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "seq_room_images")
	@SequenceGenerator(name = "seq_room_images", // JPA 내부에서 사용할 시퀀스 이름
			sequenceName = "SEQ_ROOM_IMAGES", // 실제 Oracle 시퀀스 이름
			allocationSize = 1)
	@Column(name = "ROOM_IMAGE_NO")
	private Long roomImageNo;

	// ROOM_NO를 단순 숫자가 아니라 Room 엔티티와의 연관관계로 매핑
	@ManyToOne(fetch = FetchType.LAZY) // 여러 이미지가 하나의 객실에 속하므로 다대일 관계
	@JoinColumn(name = "ROOM_NO", nullable = false) // 실제 DB의 FK 컬럼명 ROOM_NO
	private Room room; // 어떤 객실에 속한 이미지인지 Room 엔티티로 참조

	@Column(name = "IMAGE_URL", nullable = false, length = 300)
	private String imageUrl; // DB에서 VARCHAR2(300) 이므로 길이를 300으로 맞춤

	@Column(name = "SORT_ORDER", nullable = false)
	private Integer sortOrder; // 이미지 정렬 순서

}
