package com.kh.trip.dto;


import java.time.LocalDateTime;
import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import com.kh.trip.domain.enums.EventStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class EventDTO {
	private Long eventNo;
	private Long adminUser;
    private String title;
    private String content;
    private String thumbnailUrl;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Long viewCount;
    private EventStatus status;
    private List<Long> coupons;
    private List<String> couponNames;
    private MultipartFile file;
}
