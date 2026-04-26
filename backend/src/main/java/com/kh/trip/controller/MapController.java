package com.kh.trip.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kh.trip.service.MapService;

import lombok.RequiredArgsConstructor;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;


@RestController
@RequestMapping("/api/maps")
@RequiredArgsConstructor
public class MapController {
	private final MapService mapService;
	
	@GetMapping("/geocode")
	public Map<String, Double> geocodeAddress(@RequestParam String address) {
		return mapService.geocodeAddress(address);
	}
	
}
