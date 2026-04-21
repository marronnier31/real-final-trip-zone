package com.kh.trip.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.kh.trip.domain.Lodging;
import com.kh.trip.domain.enums.LodgingStatus;

public interface LodgingRepository extends JpaRepository<Lodging, Long> {
	/**
	 * 지역으로 숙소 목록 조회
	 * 
	 * 예: region = "서울" → REGION 컬럼이 "서울"인 숙소 목록 반환
	 */
	List<Lodging> findByRegionAndStatus(String region, LodgingStatus status);

	/**
	 * 숙소명에 특정 키워드가 포함된 숙소 검색
	 * 
	 * Containing = SQL의 LIKE %키워드% 개념
	 * 
	 * 예: keyword = "호텔" → 숙소명에 "호텔"이 들어간 숙소 검색
	 */
	List<Lodging> findByLodgingNameContainingAndStatus(String keyword, LodgingStatus status);

	/**
	 * 상태값으로 숙소 조회
	 * 
	 * 예: status = "ACTIVE" → 활성화된 숙소만 조회
	 */
	List<Lodging> findByStatus(LodgingStatus status);

	// host 객체 안의 userNo 기준으로 조회가 필요할 때 사용
	List<Lodging> findByHost_HostNo(Long hostNo);
	
	// ACTIVE 상태 숙소를 페이징 조회
	Page<Lodging> findByStatus(LodgingStatus status, Pageable pageable);

	/**
	 * 숙소 상세 조회용 메서드
	 * 
	 * @EntityGraph(attributePaths = "imageList")
	 * -> Lodging를 조회할 때 연관된 imageList도 함께 조회한다.
	 * -> 숙소 상세보기에서 숙소 이미지 목록이 바로 필요하므로 N+1 문제를 줄이기 위해 사용한다.
	 * 
	 * @Query("select l from Lodging l where l.lodgingNo = :lodgingNo")
	 * -> 숙소 번호(lodgingNo)가 일치하는 숙소 1개를 조회한다.
	 * -> 상태값(ACTIVE / INACTIVE) 조건은 여기서 걸지 않고,
	 *    Service 단에서 직접 상태를 검사하도록 분리한 방식이다.
	 * 
	 * 반환값:
	 * -> Optional<Lodging>
	 * -> 숙소가 존재하면 Lodging 객체를 담아서 반환
	 * -> 존재하지 않으면 Optional.empty() 반환
	 */
	@EntityGraph(attributePaths = "imageList")
	@Query("select l from Lodging l where l.lodgingNo = :lodgingNo")
	Optional<Lodging> selectOne(@Param("lodgingNo") Long lodgingNo);

	/**
	 * 숙소 목록 조회용 메서드
	 * 
	 * @Query("select l, li from Lodging l left join l.imageList li on li.sortOrder = 1 where l.status = LodgingStatus.ACTIVE")
	 * -> 활성화 상태(ACTIVE)인 숙소만 조회한다.
	 * -> 숙소와 숙소 이미지(LodgingImage)를 LEFT JOIN 해서 함께 가져온다.
	 * -> li.on li.sortOrder = 1 조건을 걸어서 대표 이미지 1장만 조회한다.
	 * 
	 * LEFT JOIN을 사용한 이유:
	 * -> 이미지가 없는 숙소도 목록에 포함시키기 위해서다.
	 * -> 이미지가 없으면 li는 null로 반환된다.
	 * 
	 * 반환값:
	 * -> List<Object[]>
	 * -> Object[0] = Lodging 객체
	 * -> Object[1] = 대표 LodgingImage 객체 (없으면 null)
	 * 
	 * 주의:
	 * -> sortOrder = 1 인 이유는 LodgingImage 저장 시 이미지 순서가 1부터 시작하기 때문이다.
	 */
	@Query("select l, li from Lodging l left join l.imageList li on li.sortOrder = 1 where l.status = LodgingStatus.ACTIVE")
	List<Object[]> selectList();
}
