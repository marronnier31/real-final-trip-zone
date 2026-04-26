package com.kh.trip.dto;

import java.util.List;
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
    private String code;
    private String value;
    private String label;
    private Long balance;
    private Long earnedThisMonth;
    private Long usedThisMonth;
    private String amount;
    private String time;
    private String type;
    private List<CodeLabelValueDTO> items;

    public static <T> CodeLabelValueDTO of(
            T entity,
            Function<T, String> valueExtractor,
            Function<T, String> labelExtractor) {
        return CodeLabelValueDTO.builder()
                .value(valueExtractor.apply(entity))
                .label(labelExtractor.apply(entity))
                .build();
    }
}
