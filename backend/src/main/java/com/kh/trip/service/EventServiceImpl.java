package com.kh.trip.service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import com.kh.trip.domain.Coupon;
import com.kh.trip.domain.Event;
import com.kh.trip.domain.EventCoupon;
import com.kh.trip.domain.User;
import com.kh.trip.domain.enums.EventStatus;
import com.kh.trip.dto.EventDTO;
import com.kh.trip.dto.PageRequestDTO;
import com.kh.trip.dto.PageResponseDTO;
import com.kh.trip.repository.CouponRepository;
import com.kh.trip.repository.EventCouponRepository;
import com.kh.trip.repository.EventRepository;
import com.kh.trip.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RequiredArgsConstructor
@Service
@Slf4j
public class EventServiceImpl implements EventService {
	private final EventRepository eventRepository;
	private final UserRepository userRepository;
	private final EventCouponRepository eventCouponRepository;
	private final CouponRepository couponRepository;

	// list
	@Override
	public PageResponseDTO<EventDTO> findAll(PageRequestDTO pageRequestDTO) {

		Pageable pageable = PageRequest.of(pageRequestDTO.getPage() - 1, pageRequestDTO.getSize(),
				Sort.by("eventNo").descending());

		Page<Event> result = eventRepository.findAllByStatusNot(EventStatus.HIDDEN, pageable);

		List<EventDTO> dtoList = result.getContent().stream().map(event -> {
			return EventDTO.builder().eventNo(event.getEventNo()).title(event.getTitle()).content(event.getContent())
					.thumbnailUrl(event.getThumbnailUrl()).startDate(event.getStartDate()).endDate(event.getEndDate())
					.viewCount(event.getViewCount()).status(event.getStatus()).build();
		}).collect(Collectors.toList());

		Long totalCount = result.getTotalElements();

		return PageResponseDTO.<EventDTO>withAll().dtoList(dtoList) // ?꾩뿉??留뚮뱺 dtoList瑜??댁븘以띾땲??
				.totalCount(totalCount).pageRequestDTO(pageRequestDTO).build();
	}

	// findById
	@Override
	public EventDTO findById(Long eventNo) {
		log.info(".....................");
		java.util.Optional<Event> result = eventRepository.findById(eventNo);
		Event event = result.orElseThrow();
		Long viewCount = event.getViewCount() + 1L;
		event.changeViewCount(viewCount);
		eventRepository.save(event);
		List<Coupon> coupons = eventCouponRepository.findCouponsByEventNo(eventNo);
		List<String> couponNames = coupons.stream().map(coupon -> coupon.getCouponName()).collect(Collectors.toList());
		return EventDTO.builder().eventNo(event.getEventNo()).title(event.getTitle()).content(event.getContent())
				.thumbnailUrl(event.getThumbnailUrl()).startDate(event.getStartDate()).endDate(event.getEndDate())
				.adminUser(event.getAdminUser().getUserNo()).couponNames(couponNames).status(event.getStatus())
				.viewCount(event.getViewCount()).build();
	}

	// save
	@Override
	public Long save(EventDTO eventDTO) {
		log.info(".........");
		User user = userRepository.findById(eventDTO.getAdminUser())
				.orElseThrow(() -> new IllegalArgumentException("議댁옱?섏? ?딅뒗 愿由ъ옄 踰덊샇?낅땲??"));

		Event event = Event.builder().title(eventDTO.getTitle()).content(eventDTO.getContent())
				.thumbnailUrl(eventDTO.getThumbnailUrl()).startDate(eventDTO.getStartDate())
				.endDate(eventDTO.getEndDate()).viewCount(0L).adminUser(user).status(EventStatus.DRAFT).build();
		// [異붽?] 2. 以묐났 寃??(諛⑹뼱 肄붾뱶)
		// 媛숈? ?쒕ぉ???대깽?멸? ?대? ?덈뒗吏 ?뺤씤?⑸땲??
		boolean isExist = eventRepository.existsByTitle(eventDTO.getTitle());

		if (isExist) {
			throw new IllegalStateException("?대? ?숈씪???쒕ぉ???대깽?멸? 議댁옱?⑸땲??");
		}
		Event savedEvent = eventRepository.save(event);
		List<Long> coupons = eventDTO.getCoupons();
		if (coupons != null && !coupons.isEmpty()) {
			List<EventCoupon> eventCouponList = coupons.stream().map(couponNo -> {
				Coupon coupon = couponRepository.findById(couponNo).orElseThrow();
				return EventCoupon.builder().event(savedEvent).coupon(coupon).build();
			}).collect(Collectors.toList());
			eventCouponRepository.saveAll(eventCouponList);
		}
		;
		return savedEvent.getEventNo();
	}

	// update
	@Override
	public void update(EventDTO eventDTO) {
		Optional<Event> result = eventRepository.findById(eventDTO.getEventNo());
		Event event = result.orElseThrow(() -> new RuntimeException("?대떦 ID ?놁쓬: " + eventDTO.getEventNo()));

		event.changeTitle(eventDTO.getTitle());
		event.changeContent(eventDTO.getContent());
		event.changeStartDate(eventDTO.getStartDate());
		event.changeEndDate(eventDTO.getEndDate());
		event.changeThumbnailUrl(eventDTO.getThumbnailUrl());
		if (eventDTO.getStatus() != null) {
			event.changeStatus(eventDTO.getStatus());
		}
		log.info("DB 議고쉶 ?쒕룄 ID: " + eventDTO.getEventNo());
		eventRepository.findAll().forEach(e -> log.info("DB???덈뒗 ID: " + e.getEventNo()));
		eventRepository.save(event);
	}

	// delete
	@Override
	public void delete(Long eventNo) {
		Optional<Event> result = eventRepository.findById(eventNo);
		Event event = result.orElseThrow(() -> new RuntimeException("?대떦 ID ?놁쓬: " + eventNo));
		event.changeStatus(EventStatus.HIDDEN);
		eventRepository.save(event);
	}

}
