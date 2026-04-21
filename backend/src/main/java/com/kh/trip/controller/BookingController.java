package com.kh.trip.controller;

import java.util.Map;

import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kh.trip.dto.BookingDTO;
import com.kh.trip.dto.PageRequestDTO;
import com.kh.trip.dto.PageResponseDTO;
import com.kh.trip.service.BookingService;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@RestController
@RequiredArgsConstructor
@Log4j2
@EnableScheduling
@RequestMapping("/api/booking")
public class BookingController {
	private final BookingService service;

	@PostMapping("/")
	public Map<String, Long> save(@RequestBody BookingDTO bookingDTO) {
		log.info("save()" + bookingDTO);
		Long bno = service.save(bookingDTO);
		return Map.of("result", bno);
	}

	@GetMapping("/{bookingNo}")
	public BookingDTO findById(@PathVariable Long bookingNo) {
		log.info("findById()" + bookingNo);
		return service.findById(bookingNo);
	}

	@GetMapping("/userlist/{userNo}")
	public PageResponseDTO<BookingDTO> findByUserId(@PathVariable Long userNo, PageRequestDTO pageRequestDTO) {
		log.info("findByUserId() userNo= " + userNo);
		return service.findByUserId(userNo, pageRequestDTO);
	}

	@DeleteMapping("/{bookingNo}")
	public Map<String, String> cancelBooking(@PathVariable Long bookingNo) {
		log.info("findByUserId() = " + bookingNo);
		service.cancelBooking(bookingNo);
		return Map.of("result", "SUCCESS");
	}

}
