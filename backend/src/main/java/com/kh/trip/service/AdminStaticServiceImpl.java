package com.kh.trip.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.kh.trip.domain.enums.BookingStatus;
import com.kh.trip.dto.AdminMonthlySalesDTO;
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
		
		Long totalCount = repository.count();
		Long canceledCount = repository.countByStatus(BookingStatus.CANCELED);
		
		Double ratio = 0.0;
		if(totalCount > 0) {
			ratio = (double) canceledCount * 100 / totalCount;
		}
		
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
		
		LocalDateTime monthlyCharStartDate = YearMonth.now().minusMonths(5).atDay(1).atStartOfDay();
		List<Object[]> monthlySalesRows = repository.getAdminMonthlySales(monthlyCharStartDate);
		Map<String, Long> monthlySalesMap = new LinkedHashMap<>();
		for(int i = 5; i >= 0; i--) {
			YearMonth month = YearMonth.now().minusMonths(i);
			monthlySalesMap.put(String.format("%d.%02d", month.getYear(),month.getMonthValue()), 0L);
		}
		for(Object[] row : monthlySalesRows) {
			monthlySalesMap.put(String.valueOf(row[0]), ((Number) row[1]).longValue());
		}
		List<AdminMonthlySalesDTO> monthlySales = monthlySalesMap.entrySet().stream().map(entry -> AdminMonthlySalesDTO.builder()
				.monthLabel(entry.getKey()).salesAmount(entry.getValue()).build()).collect(Collectors.toList());
		
		return AdminStaticDTO.builder().lodgingTypeRatioAll(dtoRatioList).canceledRatio(ratio).lodgingTypeAmountMonthly(dtoMonthlyList)
				.monthlyTotalSalesAmount(monthlyTotalSalesAmount).monthlyTotalBookingCount(monthlyTotalBookingCount).monthlySales(monthlySales).build();
	}

}
