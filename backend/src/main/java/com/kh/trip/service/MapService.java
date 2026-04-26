package com.kh.trip.service;

import java.util.Map;

public interface MapService {
	Map<String, Double> geocodeAddress(String address);
}
