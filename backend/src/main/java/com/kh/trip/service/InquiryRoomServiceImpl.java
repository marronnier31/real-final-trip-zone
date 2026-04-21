package com.kh.trip.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.kh.trip.domain.HostProfile;
import com.kh.trip.domain.InquiryMessage;
import com.kh.trip.domain.InquiryRoom;
import com.kh.trip.domain.Lodging;
import com.kh.trip.domain.User;
import com.kh.trip.domain.enums.InquiryRoomStatus;
import com.kh.trip.dto.InquiryRoomDTO;
import com.kh.trip.repository.HostProfileRepository;
import com.kh.trip.repository.InquiryMessageRepository;
import com.kh.trip.repository.InquiryRoomRepository;
import com.kh.trip.repository.LodgingRepository;
import com.kh.trip.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@Transactional
@RequiredArgsConstructor
public class InquiryRoomServiceImpl implements InquiryRoomService {

	private final InquiryRoomRepository repository;
	private final UserRepository userRepository;
	private final HostProfileRepository hostRepository;
	private final LodgingRepository lodgingRepository;
	private final InquiryMessageRepository messageRepository;

	@Override
	public Long save(InquiryRoomDTO roomDTO) {
		User user = userRepository.findById(roomDTO.getUserNo())
				.orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
		Lodging lodging = lodgingRepository.findById(roomDTO.getLodgingNo())
				.orElseThrow(() -> new IllegalArgumentException("숙소를 찾을 수 없습니다."));
		HostProfile host = lodging.getHost();
		if (host == null) {
			throw new IllegalArgumentException("호스트를 찾을 수 없습니다.");
		}
		if (host.getUser() == null || host.getUser().getUserNo() == null) {
			throw new IllegalArgumentException("숙소 판매자 계정이 올바르지 않습니다.");
		}
		if (host.getUser().getUserNo().equals(user.getUserNo())) {
			throw new IllegalArgumentException("본인 숙소에는 문의방을 생성할 수 없습니다.");
		}

		return repository.findByDetail(roomDTO.getUserNo(), host.getHostNo(), roomDTO.getLodgingNo(),
				InquiryRoomStatus.CLOSED).map(room -> room.getInquiryRoomNo()).orElseGet(() -> {
					// 동일 회원-동일 숙소 조합의 열린 방이 있으면 재사용하고, 없을 때만 새 방을 만든다.
					InquiryRoom newRoom = InquiryRoom.builder()
							.user(user)
							.host(host)
							.lodging(lodging)
							.bookingNo(roomDTO.getBookingNo())
							.status(InquiryRoomStatus.OPEN)
							.build();

					return repository.save(newRoom).getInquiryRoomNo();
				});
	}

	@Override
	public List<InquiryRoomDTO> findByUserNo(Long userNo) {
		List<InquiryRoom> rooms = new ArrayList<>();

		if (hostRepository.existsByUser_UserNo(userNo)) {
			HostProfile host = hostRepository.findByUser_UserNo(userNo)
					.orElseThrow(() -> new IllegalArgumentException("호스트 정보를 찾을 수 없습니다."));
			rooms.addAll(repository.findByHostNo(host.getHostNo(), InquiryRoomStatus.CLOSED));
		}

		User user = userRepository.findById(userNo)
				.orElseThrow(() -> new IllegalArgumentException("사용자 정보를 찾을 수 없습니다."));
		rooms.addAll(repository.findByUserNo(user.getUserNo(), InquiryRoomStatus.CLOSED));

		return mapRooms(rooms.stream().distinct().collect(Collectors.toList()));
	}

	@Override
	public List<InquiryRoomDTO> findMyRooms(Long userNo) {
		// 회원 마이페이지/숙소문의 내역용 목록
		return mapRooms(repository.findDetailByUserNo(userNo, InquiryRoomStatus.CLOSED));
	}

	@Override
	public List<InquiryRoomDTO> findSellerRooms(Long userNo) {
		// 판매자 대시보드용 목록. 로그인 userNo -> HostProfile -> 담당 문의방 순으로 찾는다.
		HostProfile host = getOwnedHostProfile(userNo);
		return mapRooms(repository.findDetailByHostNo(host.getHostNo(), InquiryRoomStatus.CLOSED));
	}

	@Override
	public void delete(Long roomNo, Long userNo) {
		Optional<InquiryRoom> result = repository.findDetailById(roomNo);
		InquiryRoom room = result.orElseThrow(() -> new IllegalArgumentException("존재하지 않는 채팅방입니다."));
		validateParticipant(room, userNo);
		room.changeStatus(InquiryRoomStatus.CLOSED);
		repository.save(room);
	}

	private HostProfile getOwnedHostProfile(Long userNo) {
		return hostRepository.findByUser_UserNo(userNo)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "판매자 정보를 찾을 수 없습니다."));
	}

	private void validateParticipant(InquiryRoom room, Long userNo) {
		boolean isUser = room.getUser().getUserNo().equals(userNo);
		boolean isHost = room.getHost().getUser() != null && room.getHost().getUser().getUserNo().equals(userNo);
		if (!isUser && !isHost) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "이 채팅방에 접근할 수 없습니다.");
		}
	}

	private List<InquiryRoomDTO> mapRooms(List<InquiryRoom> rooms) {
		Map<Long, InquiryMessage> latestMessageMap = messageRepository.findLatestMessageMapByRoomNos(
				rooms.stream().map(InquiryRoom::getInquiryRoomNo).toList());

		return rooms.stream()
				.map(room -> entityToDTO(room, latestMessageMap.get(room.getInquiryRoomNo())))
				.collect(Collectors.toList());
	}

	private InquiryRoomDTO entityToDTO(InquiryRoom room, InquiryMessage latestMessage) {
		return InquiryRoomDTO.builder()
				.inquiryRoomNo(room.getInquiryRoomNo())
				.userNo(room.getUser().getUserNo())
				.hostNo(room.getHost().getHostNo())
				.lodgingNo(room.getLodging().getLodgingNo())
				.bookingNo(room.getBookingNo())
				.status(room.getStatus())
				.lodgingName(room.getLodging().getLodgingName())
				.hostName(room.getHost().getBusinessName())
				.lastMessage(latestMessage != null ? latestMessage.getContent() : null)
				// 프론트 리스트 카드에서 바로 쓰도록 최소 표시 필드를 함께 내려준다.
				.regDate(room.getRegDate())
				.updDate(room.getUpdDate())
				.build();
	}

}
