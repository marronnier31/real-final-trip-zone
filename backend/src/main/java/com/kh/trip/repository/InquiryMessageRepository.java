package com.kh.trip.repository;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.kh.trip.domain.InquiryMessage;

public interface InquiryMessageRepository extends JpaRepository<InquiryMessage, Long>{

	@Query("select m from InquiryMessage m where m.inquiryRoom.inquiryRoomNo = :roomNo order by m.regDate asc, m.messageNo asc")
	List<InquiryMessage> findByRoomNo(@Param("roomNo")Long roomNo);

	@Query("""
			select m
			from InquiryMessage m
			where m.inquiryRoom.inquiryRoomNo in :roomNos
			  and m.messageNo in (
			  	select max(m2.messageNo)
			  	from InquiryMessage m2
			  	where m2.inquiryRoom.inquiryRoomNo in :roomNos
			  	group by m2.inquiryRoom.inquiryRoomNo
			  )
			""")
	List<InquiryMessage> findLatestByRoomNos(@Param("roomNos") List<Long> roomNos);

	default Map<Long, InquiryMessage> findLatestMessageMapByRoomNos(List<Long> roomNos) {
		if (roomNos == null || roomNos.isEmpty()) {
			return Map.of();
		}

		return findLatestByRoomNos(roomNos).stream()
				.collect(Collectors.toMap(
						message -> message.getInquiryRoom().getInquiryRoomNo(),
						Function.identity(),
						(left, right) -> left.getMessageNo() > right.getMessageNo() ? left : right));
	}

}
