package com.kh.trip.service;

import java.text.NumberFormat;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.kh.trip.domain.Coupon;
import com.kh.trip.domain.User;
import com.kh.trip.domain.UserCoupon;
import com.kh.trip.dto.CouponDTO;
import com.kh.trip.dto.PageRequestDTO;
import com.kh.trip.dto.PageResponseDTO;
import com.kh.trip.dto.UserCouponDTO;
import com.kh.trip.repository.CouponRepository;
import com.kh.trip.repository.UserCouponRepository;
import com.kh.trip.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@Log4j2
@Service
@RequiredArgsConstructor
@Transactional
public class UserCouponServiceImpl implements UserCouponService {

    private static final NumberFormat NUMBER_FORMAT = NumberFormat.getNumberInstance(Locale.KOREA);
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy.MM.dd");
    private static final DateTimeFormatter SHORT_DATE_FORMAT = DateTimeFormatter.ofPattern("MM.dd");

    private final UserCouponRepository repository;
    private final UserRepository userRepository;
    private final CouponRepository couponRepository;

    @Override
    public Long save(Long userNo, UserCouponDTO userCouponDTO) {
        UserCoupon userCoupon = dtoToEntity(userNo, userCouponDTO);

        if (userCoupon.getStatus() == null) {
            userCoupon.determineFinalStatus();
        }

        return repository.save(userCoupon).getUserCouponNo();
    }

    @Override
    public PageResponseDTO<UserCouponDTO> findAll(Long userNo, PageRequestDTO pageRequestDTO) {
        Pageable pageable = PageRequest.of(pageRequestDTO.getPage() - 1, pageRequestDTO.getSize(),
                Sort.by("userCouponNo").descending());

        Page<UserCoupon> result = repository.findByUser(userNo, pageable);
        List<UserCouponDTO> dtoList = entityToDTO(result);

        return PageResponseDTO.<UserCouponDTO>withAll().dtoList(dtoList)
                .pageRequestDTO(pageRequestDTO)
                .totalCount(result.getTotalElements())
                .build();
    }

    public UserCoupon dtoToEntity(Long userNo, UserCouponDTO userCouponDTO) {
        User user = userRepository.findById(userNo)
                .orElseThrow(() -> new IllegalAccessError("사용자 정보를 찾을 수 없습니다."));

        Coupon coupon = couponRepository.findById(userCouponDTO.getCouponNo())
                .orElseThrow(() -> new IllegalAccessError("쿠폰 정보를 찾을 수 없습니다."));

        if (coupon.getStartDate().isAfter(LocalDateTime.now())) {
            throw new IllegalStateException("아직 발급할 수 없는 쿠폰입니다.");
        }

        boolean checkUserCoupon = repository.existenceCheck(userNo, userCouponDTO.getCouponNo());

        if (checkUserCoupon) {
            throw new IllegalStateException("이미 받은 쿠폰입니다.");
        }

        return UserCoupon.builder()
                .user(user)
                .coupon(coupon)
                .issuedAt(userCouponDTO.getIssuedAt())
                .usedAt(userCouponDTO.getUsedAt())
                .status(userCouponDTO.getStatus())
                .build();
    }

    public List<UserCouponDTO> entityToDTO(Page<UserCoupon> result) {
        return result.getContent().stream().map(userCoupon -> {
            var finalStatus = userCoupon.determineFinalStatus();
            Coupon coupon = userCoupon.getCoupon();

            CouponDTO couponDTO = CouponDTO.builder()
                    .couponName(coupon.getCouponName())
                    .discountType(coupon.getDiscountType())
                    .discountValue(coupon.getDiscountValue())
                    .startDate(coupon.getStartDate())
                    .endDate(coupon.getEndDate())
                    .status(coupon.getStatus())
                    .build();

            return UserCouponDTO.builder()
                    .userCouponNo(userCoupon.getUserCouponNo())
                    .userNo(userCoupon.getUser().getUserNo())
                    .couponNo(coupon.getCouponNo())
                    .couponDTO(couponDTO)
                    .issuedAt(userCoupon.getIssuedAt())
                    .usedAt(userCoupon.getUsedAt())
                    .status(finalStatus)
                    .couponName(coupon.getCouponName())
                    .couponType(coupon.getDiscountType().name())
                    .discountValue(coupon.getDiscountValue())
                    .discountLabel(formatDiscount(coupon))
                    .statusLabel(finalStatus.name())
                    .expire(formatExpire(coupon))
                    .expiredAt(coupon.getEndDate() != null ? DATE_FORMAT.format(coupon.getEndDate()) : null)
                    .usable("ACTIVE".equals(finalStatus.name()))
                    .build();
        }).collect(Collectors.toList());
    }

    private String formatDiscount(Coupon coupon) {
        if ("PERCENT".equals(coupon.getDiscountType().name())) {
            return coupon.getDiscountValue() + "%";
        }
        return NUMBER_FORMAT.format(coupon.getDiscountValue()) + "원";
    }

    private String formatExpire(Coupon coupon) {
        if (coupon.getEndDate() == null) {
            return null;
        }
        return SHORT_DATE_FORMAT.format(coupon.getEndDate()) + " 만료";
    }
}
