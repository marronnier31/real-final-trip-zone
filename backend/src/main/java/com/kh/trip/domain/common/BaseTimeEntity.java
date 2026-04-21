package com.kh.trip.domain.common;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;

import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import lombok.Getter;

@Getter
@MappedSuperclass
public abstract class BaseTimeEntity {

	@JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
	private LocalDateTime regDate;

	@JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
	private LocalDateTime updDate;

	@PrePersist
	public void prePersist() {
		LocalDateTime now = LocalDateTime.now();
		this.regDate = now;
		this.updDate = now;
	}

	@PreUpdate
	public void preUpdate() {
		this.updDate = LocalDateTime.now();
	}

}
