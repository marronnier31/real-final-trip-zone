package com.kh.trip.dto;

import java.util.ArrayList;
import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import com.kh.trip.domain.enums.LodgingStatus;
import com.kh.trip.domain.enums.LodgingType;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class LodgingDTO {

	private Long lodgingNo; // 숙소 번호
	private Long hostNo; // 호스트 번호
	private String lodgingName; // 숙소명
	private LodgingType lodgingType; // 숙소 유형
	private String region; // 지역
	private String address; // 기본 주소
	private String detailAddress; // 상세 주소
	private String zipCode; // 우편번호
	private Double latitude; // 위도
	private Double longitude; // 경도
	private String description; // 숙소 설명
	private String checkInTime; // 체크인 시간
	private String checkOutTime; // 체크아웃 시간
	private LodgingStatus status; // 숙소 상태
	private Double reviewAverage; // 리뷰 평균 평점
	private Long reviewCount; // 공개 리뷰 수

	// 업로드 받을 파일들
	@Builder.Default
	private List<MultipartFile> files = new ArrayList<>();

	// 실제 저장된 파일명 목록
	@Builder.Default
	private List<String> uploadFileNames = new ArrayList<>();

	// 상세조회 시 같이 내려줄 객실 목록
	@Builder.Default
	private List<RoomDTO> rooms = new ArrayList<>();

	public void setPostCode(String postCode) {
		this.zipCode = postCode;
	}

	public void setCheckIn(String checkIn) {
		this.checkInTime = checkIn;
	}

	public void setCheckOut(String checkOut) {
		this.checkOutTime = checkOut;
	}
}
