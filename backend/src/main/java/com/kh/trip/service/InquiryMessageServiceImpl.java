package com.kh.trip.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import com.kh.trip.domain.Booking;
import com.kh.trip.domain.InquiryMessage;
import com.kh.trip.domain.InquiryRoom;
import com.kh.trip.domain.User;
import com.kh.trip.domain.enums.BookingStatus;
import com.kh.trip.domain.enums.InquiryRoomStatus;
import com.kh.trip.domain.enums.SenderType;
import com.kh.trip.dto.InquiryMessageDTO;
import com.kh.trip.repository.BookingRepository;
import com.kh.trip.repository.InquiryMessageRepository;
import com.kh.trip.repository.InquiryRoomRepository;
import com.kh.trip.repository.UserRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class InquiryMessageServiceImpl implements InquiryMessageService {

	private final InquiryMessageRepository repository;
	private final InquiryRoomRepository roomRepository;
	private final UserRepository userRepository;
	private final BookingRepository bookingRepository;

	@Override
	public List<InquiryMessageDTO> findByRoomNo(Long roomNo) {
		List<InquiryMessage> result = repository.findByRoomNo(roomNo);
		return result.stream().map(message -> entityToDTO(message)).collect(Collectors.toList());
	}

	@Override
	public List<InquiryMessageDTO> findByRoomNo(Long roomNo, Long userNo) {
		InquiryRoom room = roomRepository.findDetailById(roomNo)
				.orElseThrow(() -> new IllegalArgumentException("존재하지 않는 채팅방입니다."));
		// 메시지 히스토리는 회원 본인 또는 해당 판매자만 볼 수 있다.
		validateParticipant(room, userNo);
		return findByRoomNo(roomNo);
	}

	@Override
	public InquiryMessageDTO save(InquiryMessageDTO messageDTO) {
		InquiryRoom room = roomRepository.findDetailById(messageDTO.getInquiryRoomNo())
				.orElseThrow(() -> new IllegalArgumentException("존재하지 않는 채팅방입니다."));

		if (room.getStatus() == InquiryRoomStatus.CLOSED) {
			throw new IllegalArgumentException("닫힌 채팅방에는 메시지를 보낼 수 없습니다.");
		}

		if (messageDTO.getContent() == null || messageDTO.getContent().isBlank()) {
			throw new IllegalArgumentException("메시지 내용은 비어 있을 수 없습니다.");
		}

		User sender = userRepository.findById(messageDTO.getSenderNo())
				.orElseThrow(() -> new IllegalArgumentException("발신자 정보가 올바르지 않습니다."));

		SenderType senderType;
		if (room.getUser().getUserNo().equals(sender.getUserNo())) {
			senderType = SenderType.USER;
		} else if (room.getHost().getUser().getUserNo().equals(sender.getUserNo())) {
			senderType = SenderType.HOST;
		} else {
			throw new IllegalArgumentException("이 채팅방의 참여자가 아닙니다.");
		}
		
		if (room.getBookingNo() == null) {
			List<Booking> bookings = bookingRepository
		        .findForInquiryRoom(
		            room.getUser().getUserNo(),
		            room.getLodging().getLodgingNo(),
		            List.of(BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.COMPLETED),
		            PageRequest.of(0, 1) // 1건만 조회해 오고 싶어서
		        );

			Booking booking = bookings.isEmpty() ? null : bookings.get(0);
			
		    if (booking != null) {
		        room.changeBookingNo(booking.getBookingNo());
		        roomRepository.save(room);
		    }
		}

		InquiryMessage message = InquiryMessage.builder()
				.inquiryRoom(room)
				.user(sender)
				.senderType(senderType)
				.content(messageDTO.getContent())
				.build();

		InquiryMessage savedMessage = repository.save(message);

		if (senderType == SenderType.USER) {
			// 회원이 새로 보낸 메시지는 판매자 답변 대기 상태로 본다.
			room.changeStatus(InquiryRoomStatus.WAITING);
		} else {
			// 판매자가 응답하면 답변 완료 상태로 바꿔서 대시보드/회원 화면이 같은 상태를 본다.
			room.changeStatus(InquiryRoomStatus.ANSWERED);
		}
		roomRepository.save(room);

		return entityToDTO(savedMessage);
	}

	private InquiryMessageDTO entityToDTO(InquiryMessage message) {
		return InquiryMessageDTO.builder()
				.messageNo(message.getMessageNo())
				.inquiryRoomNo(message.getInquiryRoom().getInquiryRoomNo())
				.senderNo(message.getUser().getUserNo())
				.senderType(message.getSenderType())
				.senderName(message.getUser().getUserName())
				.content(message.getContent())
				.regDate(message.getRegDate())
				.build();
	}

	private void validateParticipant(InquiryRoom room, Long userNo) {
		boolean isUser = room.getUser().getUserNo().equals(userNo);
		boolean isHost = room.getHost().getUser().getUserNo().equals(userNo);
		if (!isUser && !isHost) {
			throw new IllegalArgumentException("이 채팅방에 접근할 수 없습니다.");
		}
	}

}
