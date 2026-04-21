package com.kh.trip.dto;

import java.util.function.Function;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CodeLabelValueDTO {
	private String value; // group_code (예: "A01")
	private String label; // group_name (예: "관리자")

	// 범용 변환 메서드 (정적 팩토리 메서드)
	// Extractor는 전체 데이터 객체에서 내가 필요한 특정 데이터만 뽑아내기 위해 정의한 함수(추출기)
	public static <T> CodeLabelValueDTO of(T entity, Function<T, String> valueExtractor,
			Function<T, String> labelExtractor) {
		return CodeLabelValueDTO.builder().value(valueExtractor.apply(entity)).label(labelExtractor.apply(entity)).build();
	}
	
	/*** 실제 서비스 단에서 사용하는 예시 ***
	public List<CodeLabelValue> getGroupCodes() {
    List<GroupCode> list = repository.findAll();
    return list.stream()
               .map(entity -> CodeLabelValue.of(entity, GroupCode::getGroupCode, GroupCode::getGroupName))
               .toList();
	}
	*/
}