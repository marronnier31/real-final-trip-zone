package com.kh.trip.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.kh.trip.domain.enums.BookingStatus;
import com.kh.trip.dto.AdminStaticDTO;
import com.kh.trip.dto.LodgingTypeAmountMonthlyDTO;
import com.kh.trip.dto.LodgingTypeRatioAllDTO;
import com.kh.trip.repository.AdminStaticRepository;

import lombok.RequiredArgsConstructor;

@Service
@Transactional
@RequiredArgsConstructor
public class AdminStaticServiceImpl implements AdminStaticService {

	private final AdminStaticRepository repository;
	
	@Override
	public AdminStaticDTO adminStatic() {
		List<Object[]> ratioResult =  repository.lodgingTypeRatioAll(List.of(
	            BookingStatus.PENDING,
	            BookingStatus.CONFIRMED,
	            BookingStatus.COMPLETED
	        ));
		
		List<LodgingTypeRatioAllDTO> dtoRatioList = ratioResult.stream().map(arr -> new LodgingTypeRatioAllDTO(
				(String)arr[0],
				(Long)arr[1],
				(Double)arr[2]
				)).collect(Collectors.toList());
		
		Double canceledRatio = repository.canceledRatio(BookingStatus.CANCELED);
		
		LocalDateTime startDate = LocalDate.now().withDayOfMonth(1).atStartOfDay();
		LocalDateTime endDate = startDate.plusMonths(1);
		List<Object[]> monthlyResult = repository.monthlySalesAmount(BookingStatus.COMPLETED,startDate,endDate);
		List<LodgingTypeAmountMonthlyDTO> dtoMonthlyList = monthlyResult.stream().map(arr -> new LodgingTypeAmountMonthlyDTO(
				(String)arr[0],
				(Long)arr[1],
				(Long)arr[2]
				)).collect(Collectors.toList());
		
		Long monthlyTotalSalesAmount = repository.monthlyTotalSalesAmount(BookingStatus.COMPLETED,startDate,endDate);
		Long monthlyTotalBookingCount = repository.monthlyTotalBookingCount(BookingStatus.COMPLETED,startDate,endDate);
		return AdminStaticDTO.builder().lodgingTypeRatioAll(dtoRatioList).canceledRatio(canceledRatio).lodgingTypeAmountMonthly(dtoMonthlyList)
				.monthlyTotalSalesAmount(monthlyTotalSalesAmount).monthlyTotalBookingCount(monthlyTotalBookingCount).build();
	}

}
