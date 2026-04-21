package com.kh.trip.domain;

import com.kh.trip.domain.common.BaseTimeEntity;
import com.kh.trip.domain.enums.RoomStatus;

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
@Table(name = "ROOMS")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Room extends BaseTimeEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "seq_rooms")
	@SequenceGenerator(name = "seq_rooms", // JPA 내부 시퀀스 이름
			sequenceName = "SEQ_ROOMS", // 실제 DB 시퀀스 이름
			allocationSize = 1)
	@Column(name = "ROOM_NO") // ROOM_NO 컬럼
	private Long roomNo;

	// Lodging 엔티티와 연관관계로 매핑
	@ManyToOne(fetch = FetchType.LAZY) // 여러 객실이 하나의 숙소에 속하므로 다대일 관계
	@JoinColumn(name = "LODGING_NO", nullable = false) // 실제 DB의 FK 컬럼명 LODGING_NO
	private Lodging lodging; // 어떤 숙소에 속한 객실인지 Lodging 엔티티로 참조

	@Column(name = "ROOM_NAME", nullable = false, length = 200) // 객실명
	private String roomName;

	@Column(name = "ROOM_TYPE", nullable = false, length = 50) // 객실 유형
	private String roomType;

	@Lob
	@Column(name = "ROOM_DESCRIPTION") // 객실 설명
	private String roomDescription;

	@Column(name = "MAX_GUEST_COUNT", nullable = false) // 최대 인원
	private Integer maxGuestCount;

	@Column(name = "PRICE_PER_NIGHT", nullable = false) // 1박 가격
	private Integer pricePerNight;

	@Column(name = "ROOM_COUNT", nullable = false) // 동일 객실 수
	private Integer roomCount;

	@Enumerated(EnumType.STRING)
	@Builder.Default
	@Column(name = "STATUS", nullable = false, length = 20) // 객실 상태
	private RoomStatus status = RoomStatus.AVAILABLE;
	
	public void changeLodging(Lodging lodging) {
		this.lodging = lodging;
	}

	// 객실명 변경
	public void changeRoomName(String roomName) {
		this.roomName = roomName;
	}

	// 객실 설명 변경
	public void changeRoomDescription(String roomDescription) {
		this.roomDescription = roomDescription;
	}

	// 1박 가격 변경
	public void changePricePerNight(Integer pricePerNight) {
		this.pricePerNight = pricePerNight;
	}

	// 객실 수 변경
	public void changeRoomCount(Integer roomCount) {
		this.roomCount = roomCount;
	}

	// 객실 상태 변경
	public void changeStatus(RoomStatus status) {
		this.status = status;
	}

	// 객실 유형 변경
	public void changeRoomType(String roomType) {
		this.roomType = roomType;
	}

	// 최대 수용 인원 변경
	public void changeMaxGuestCount(Integer maxGuestCount) {
		this.maxGuestCount = maxGuestCount;
	}

}
