package com.kh.trip.service;

import java.text.NumberFormat;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.kh.trip.domain.MileageHistory;
import com.kh.trip.domain.User;
import com.kh.trip.domain.UserAuthProvider;
import com.kh.trip.domain.enums.MileageChangeType;
import com.kh.trip.dto.CodeLabelValueDTO;
import com.kh.trip.dto.PageRequestDTO;
import com.kh.trip.dto.PageResponseDTO;
import com.kh.trip.dto.UserDTO;
import com.kh.trip.repository.MileageHistoryRepository;
import com.kh.trip.repository.UserAuthProviderRepository;
import com.kh.trip.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MypageServiceImpl implements MypageService {

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy.MM.dd");
    private static final DateTimeFormatter DATE_TIME_FORMAT = DateTimeFormatter.ofPattern("yyyy.MM.dd HH:mm");
    private static final NumberFormat NUMBER_FORMAT = NumberFormat.getNumberInstance(Locale.KOREA);

    private final UserAuthProviderRepository userAuthProviderRepository;
    private final UserRepository userRepository;
    private final MileageHistoryRepository mileageHistoryRepository;

    @Override
    public UserDTO getProfile(Long userNo) {
        User user = getUser(userNo);
        List<UserAuthProvider> authProviders = userAuthProviderRepository.findByUserNo(userNo);

        return UserDTO.builder()
                .userNo(user.getUserNo())
                .userName(user.getUserName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .gradeName(user.getMemberGrade() != null ? user.getMemberGrade().getGradeName() : null)
                .mileage(user.getMileage())
                .enabled(user.getEnabled())
                .grade(user.getMemberGrade() != null ? user.getMemberGrade().getGradeName().name() : null)
                .gradeHint("누적 마일리지 " + NUMBER_FORMAT.format(defaultLong(user.getMileage())) + "P")
                .status("1".equals(user.getEnabled()) ? "활성 회원" : "비활성 회원")
                .joinedAt(user.getRegDate() != null ? DATE_FORMAT.format(user.getRegDate()) + " 가입" : null)
                .details(List.of(
                        profileDetail("이메일", user.getEmail()),
                        profileDetail("전화번호", user.getPhone()),
                        profileDetail("로그인 방식", resolveLoginMethod(authProviders)),
                        profileDetail("회원 등급",
                                user.getMemberGrade() != null ? user.getMemberGrade().getGradeName().name() : null),
                        profileDetail("비밀번호", "********"),
                        profileDetail("최근 로그인", resolveLastLoginAt(authProviders))))
                .build();
    }

    @Override
    public CodeLabelValueDTO getMileage(Long userNo) {
        User user = getUser(userNo);
        List<MileageHistory> rows = mileageHistoryRepository
                .findByUser_UserNoOrderByRegDateDesc(userNo, Pageable.unpaged())
                .getContent();

        return toMileageSummary(user, rows);
    }

    @Override
    public PageResponseDTO<CodeLabelValueDTO> getMileageHistory(Long userNo, PageRequestDTO pageRequestDTO) {
        int page = pageRequestDTO.getPage() <= 0 ? 1 : pageRequestDTO.getPage();
        int size = pageRequestDTO.getSize() <= 0 ? 10 : pageRequestDTO.getSize();
        Pageable pageable = PageRequest.of(page - 1, size);

        Page<MileageHistory> result = mileageHistoryRepository.findByUser_UserNoOrderByRegDateDesc(userNo, pageable);

        return PageResponseDTO.<CodeLabelValueDTO>withAll()
                .dtoList(result.stream().map(this::toMileageItem).toList())
                .pageRequestDTO(pageRequestDTO)
                .totalCount(result.getTotalElements())
                .build();
    }

    private User getUser(Long userNo) {
        return userRepository.findById(userNo)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다."));
    }

    private CodeLabelValueDTO profileDetail(String label, String value) {
        return CodeLabelValueDTO.builder().label(label).value(value).build();
    }

    private CodeLabelValueDTO toMileageSummary(User user, List<MileageHistory> rows) {
        YearMonth currentMonth = YearMonth.now();

        return CodeLabelValueDTO.builder()
                .balance(defaultLong(user.getMileage()))
                .earnedThisMonth(rows.stream()
                        .filter(history -> isSameMonth(history.getRegDate(), currentMonth))
                        .filter(history -> history.getChangeType() == MileageChangeType.EARN)
                        .mapToLong(MileageHistory::getChangeAmount)
                        .sum())
                .usedThisMonth(rows.stream()
                        .filter(history -> isSameMonth(history.getRegDate(), currentMonth))
                        .filter(history -> history.getChangeType() == MileageChangeType.USE)
                        .mapToLong(MileageHistory::getChangeAmount)
                        .sum())
                .items(rows.stream().map(this::toMileageItem).toList())
                .build();
    }

    private CodeLabelValueDTO toMileageItem(MileageHistory history) {
        boolean minus = history.getChangeType() == MileageChangeType.USE
                || history.getChangeType() == MileageChangeType.EXPIRE;
        long amount = defaultLong(history.getChangeAmount());
        return CodeLabelValueDTO.builder()
                .label(history.getReason())
                .amount((minus ? "-" : "+") + NUMBER_FORMAT.format(amount))
                .time(history.getRegDate() != null ? DATE_FORMAT.format(history.getRegDate()) : null)
                .type(toMileageTypeLabel(history.getChangeType()))
                .build();
    }

    private boolean isSameMonth(LocalDateTime value, YearMonth targetMonth) {
        return value != null && YearMonth.from(value).equals(targetMonth);
    }

    private String toMileageTypeLabel(MileageChangeType type) {
        return switch (type) {
        case EARN -> "적립";
        case USE -> "사용";
        case CANCEL_USE -> "사용 복구";
        case EXPIRE -> "만료";
        case ADJUST -> "조정";
        };
    }

    private String resolveLoginMethod(List<UserAuthProvider> authProviders) {
        if (authProviders.isEmpty()) {
            return null;
        }
        return authProviders.stream()
                .map(UserAuthProvider::getProviderCode)
                .distinct()
                .map(this::toProviderLabel)
                .reduce((left, right) -> left + ", " + right)
                .orElse(null);
    }

    private String resolveLastLoginAt(List<UserAuthProvider> authProviders) {
        return authProviders.stream()
                .map(UserAuthProvider::getLastLoginAt)
                .filter(java.util.Objects::nonNull)
                .max(java.util.Comparator.naturalOrder())
                .map(DATE_TIME_FORMAT::format)
                .orElse(null);
    }

    private String toProviderLabel(String providerCode) {
        if (providerCode == null) {
            return null;
        }
        return switch (providerCode.toUpperCase(Locale.ROOT)) {
        case "KAKAO" -> "카카오 간편 로그인";
        case "NAVER" -> "네이버 간편 로그인";
        case "GOOGLE" -> "구글 간편 로그인";
        case "LOCAL" -> "이메일 로그인";
        default -> providerCode;
        };
    }

    private long defaultLong(Long value) {
        return value != null ? value : 0L;
    }
}
