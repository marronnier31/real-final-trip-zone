package com.kh.trip.service;

import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.kh.trip.domain.Booking;
import com.kh.trip.domain.MileageHistory;
import com.kh.trip.domain.Payment;
import com.kh.trip.domain.Room;
import com.kh.trip.domain.User;
import com.kh.trip.domain.enums.BookingStatus;
import com.kh.trip.domain.enums.MileageChangeType;
import com.kh.trip.domain.enums.MileageStatus;
import com.kh.trip.domain.enums.PaymentPayMethod;
import com.kh.trip.domain.enums.PaymentStatus;
import com.kh.trip.domain.enums.RoomStatus;
import com.kh.trip.dto.PageRequestDTO;
import com.kh.trip.dto.PageResponseDTO;
import com.kh.trip.dto.PaymentDTO;
import com.kh.trip.repository.BookingRepository;
import com.kh.trip.repository.MileageHistoryRepository;
import com.kh.trip.repository.PaymentRepository;
import com.kh.trip.repository.RoomRepository;
import com.kh.trip.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class PaymentServiceImpl implements PaymentService {

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy.MM.dd");
    private static final NumberFormat NUMBER_FORMAT = NumberFormat.getNumberInstance(Locale.KOREA);

    private final UserRepository userRepository;
    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;
    private final RoomRepository roomRepository;
    private final MileageHistoryRepository mileageHistoryRepository;

    @Override
    public Long save(PaymentDTO paymentDTO, Long userNo) {
        Booking booking = bookingRepository.findById(paymentDTO.getBookingNo())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "예약을 찾을 수 없습니다."));
        User user = booking.getUser();
        if (!user.getUserNo().equals(userNo)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "다른 사용자의 예약은 결제할 수 없습니다.");
        }

        List<PaymentStatus> blockedStatuses = List.of(PaymentStatus.READY, PaymentStatus.PAID);
        boolean exists = paymentRepository.existsByBooking_BookingNoAndPaymentStatusIn(paymentDTO.getBookingNo(),
                blockedStatuses);

        if (exists) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 진행 중이거나 완료된 결제가 있습니다.");
        }

        Payment payment = dtoToEntity(paymentDTO);
        Payment result = paymentRepository.save(payment);

        Long usedMileage = booking.getMileageUsed() == null ? 0L : booking.getMileageUsed();
        if (usedMileage > 0) {
            boolean alreadyUsed = mileageHistoryRepository.existsByPayment_PaymentNoAndChangeTypeAndStatus(
                    result.getPaymentNo(), MileageChangeType.USE, MileageStatus.NORMAL);

            if (!alreadyUsed) {
                user.useMileage(usedMileage);

                MileageHistory mileageHistory = MileageHistory.builder()
                        .user(user)
                        .booking(booking)
                        .payment(result)
                        .changeType(MileageChangeType.USE)
                        .changeAmount(usedMileage)
                        .balanceAfter(user.getMileage())
                        .reason("예약 결제 시 마일리지 사용")
                        .status(MileageStatus.NORMAL)
                        .build();

                mileageHistoryRepository.save(mileageHistory);
                userRepository.save(user);
            }
        }

        return result.getPaymentNo();
    }

    @Override
    public PageResponseDTO<PaymentDTO> getPaymentsByBooking(Long bookingNo, Long userNo, PageRequestDTO pageRequestDTO) {
        Booking booking = bookingRepository.findById(bookingNo)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "예약을 찾을 수 없습니다."));

        if (!booking.getUser().getUserNo().equals(userNo)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "다른 사용자의 예약은 조회할 수 없습니다.");
        }

        Pageable pageable = PageRequest.of(pageRequestDTO.getPage() - 1, pageRequestDTO.getSize(),
                Sort.by("paymentNo").descending());

        Page<Payment> result = paymentRepository.findByBooking_BookingNoOrderByPaymentNoDesc(bookingNo, pageable);
        List<PaymentDTO> dtoList = result.stream().map(this::entityToDTO).collect(Collectors.toList());

        return PageResponseDTO.<PaymentDTO>withAll()
                .dtoList(dtoList)
                .pageRequestDTO(pageRequestDTO)
                .totalCount(result.getTotalElements())
                .build();
    }

    @Override
    public PageResponseDTO<PaymentDTO> findByUserId(Long userNo, PageRequestDTO pageRequestDTO) {
        Pageable pageable = PageRequest.of(pageRequestDTO.getPage() - 1, pageRequestDTO.getSize(),
                Sort.by("paymentNo").descending());

        Page<Payment> result = paymentRepository.findByUserId(userNo, pageable);
        List<PaymentDTO> dtoList = result.stream().map(this::entityToDTO).toList();

        return PageResponseDTO.<PaymentDTO>withAll()
                .dtoList(dtoList)
                .pageRequestDTO(pageRequestDTO)
                .totalCount(result.getTotalElements())
                .build();
    }

    @Override
    public PaymentDTO getPaymentById(Long paymentNo, Long userNo) {
        Payment payment = paymentRepository.findById(paymentNo)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "결제를 찾을 수 없습니다."));

        if (!payment.getBooking().getUser().getUserNo().equals(userNo)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "다른 사용자의 결제는 조회할 수 없습니다.");
        }
        return entityToDTO(payment);
    }

    @Override
    public void complete(Long paymentNo) {
        Payment payment = paymentRepository.findById(paymentNo)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "결제를 찾을 수 없습니다."));

        if (payment.getPaymentStatus() == PaymentStatus.PAID) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 완료된 결제입니다.");
        }

        if (payment.getPaymentStatus() == PaymentStatus.CANCELED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "취소된 결제는 완료 처리할 수 없습니다.");
        }

        payment.changePaymentStatus(PaymentStatus.PAID);
        payment.changeApprovedAt(LocalDateTime.now());

        Booking booking = payment.getBooking();
        booking.confirm();

        paymentRepository.save(payment);
        bookingRepository.save(booking);
    }

    @Override
    public void cancel(Long paymentNo, Long userNo) {
        Payment payment = paymentRepository.findById(paymentNo)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "결제를 찾을 수 없습니다."));

        if (!payment.getBooking().getUser().getUserNo().equals(userNo)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "다른 사용자의 결제는 취소할 수 없습니다.");
        }

        Booking booking = payment.getBooking();
        if (booking.getStatus() == BookingStatus.COMPLETED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "완료된 예약의 결제는 취소할 수 없습니다.");
        }
        if (payment.getPaymentStatus() == PaymentStatus.CANCELED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 취소된 결제입니다.");
        }

        if (payment.getPaymentStatus() != PaymentStatus.READY && payment.getPaymentStatus() != PaymentStatus.PAID) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "현재 상태에서는 결제를 취소할 수 없습니다.");
        }

        List<MileageHistory> histories = mileageHistoryRepository.findByPayment_PaymentNo(paymentNo);
        for (MileageHistory history : histories) {
            if (history.getChangeType() == MileageChangeType.EARN && history.getStatus() == MileageStatus.NORMAL) {
                User user = history.getUser();
                user.useMileage(history.getChangeAmount());
                history.changeStatus(MileageStatus.CANCELED);
                userRepository.save(user);
                continue;
            }

            if (history.getChangeType() == MileageChangeType.USE && history.getStatus() == MileageStatus.NORMAL) {
                User user = history.getUser();
                user.addMileage(history.getChangeAmount());
                history.changeStatus(MileageStatus.CANCELED);

                MileageHistory restoreHistory = MileageHistory.builder()
                        .user(user)
                        .booking(history.getBooking())
                        .payment(payment)
                        .changeType(MileageChangeType.CANCEL_USE)
                        .changeAmount(history.getChangeAmount())
                        .balanceAfter(user.getMileage())
                        .reason("결제 취소로 인한 마일리지 복구")
                        .status(MileageStatus.NORMAL)
                        .build();

                mileageHistoryRepository.save(restoreHistory);
                userRepository.save(user);
            }
        }

        LocalDate today = LocalDate.now();
        LocalDate noRefundDate = booking.getCheckInDate().toLocalDate().minusDays(1);

        if (!today.isBefore(noRefundDate)) {
            payment.changeRefundAmount(0L);
        } else {
            payment.changeRefundAmount(payment.getPaymentAmount());
        }

        payment.changePaymentStatus(PaymentStatus.CANCELED);
        payment.changeCanceledAt(LocalDateTime.now());
        booking.cancel();

        Room room = booking.getRoom();
        room.changeStatus(RoomStatus.AVAILABLE);

        paymentRepository.save(payment);
        bookingRepository.save(booking);
        roomRepository.save(room);
    }

    private Payment dtoToEntity(PaymentDTO paymentDTO) {
        Booking booking = bookingRepository.findById(paymentDTO.getBookingNo())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "예약을 찾을 수 없습니다. bookingNo=" + paymentDTO.getBookingNo()));
        String orderName = booking.getRoom().getLodging().getLodgingName() + " "
                + booking.getRoom().getRoomName() + " 예약";

        return Payment.builder()
                .booking(booking)
                .paymentId(paymentDTO.getPaymentId())
                .storeId(paymentDTO.getStoreId())
                .channelKey(paymentDTO.getChannelKey())
                .orderName(orderName)
                .paymentAmount(booking.getTotalPrice())
                .currency(paymentDTO.getCurrency() != null ? paymentDTO.getCurrency() : "KRW")
                .payMethod(parsePayMethod(paymentDTO.getPayMethod()))
                .pgProvider(paymentDTO.getPgProvider())
                .paymentStatus(PaymentStatus.READY)
                .approvedAt(null)
                .canceledAt(null)
                .refundAmount(0L)
                .failReason(null)
                .rawResponse(null)
                .build();
    }

    private PaymentDTO entityToDTO(Payment payment) {
        String resolvedStatus = resolvePaymentStatus(payment);

        return PaymentDTO.builder()
                .paymentNo(payment.getPaymentNo())
                .bookingNo(payment.getBooking().getBookingNo())
                .paymentId(payment.getPaymentId())
                .storeId(payment.getStoreId())
                .channelKey(payment.getChannelKey())
                .orderName(payment.getOrderName())
                .paymentAmount(payment.getPaymentAmount())
                .currency(payment.getCurrency())
                .payMethod(payment.getPayMethod() != null ? payment.getPayMethod().name() : null)
                .pgProvider(payment.getPgProvider())
                .paymentStatus(payment.getPaymentStatus().name())
                .approvedAt(payment.getApprovedAt())
                .canceledAt(payment.getCanceledAt())
                .refundAmount(payment.getRefundAmount())
                .failReason(payment.getFailReason())
                .rawResponse(payment.getRawResponse())
                .bookingId("B-" + payment.getBooking().getBookingNo())
                .lodgingName(payment.getBooking().getRoom().getLodging().getLodgingName())
                .roomName(payment.getBooking().getRoom().getRoomName())
                .amount("REFUNDED".equals(resolvedStatus)
                        ? "-" + NUMBER_FORMAT.format(defaultLong(payment.getRefundAmount())) + "원"
                        : formatWon(defaultLong(payment.getPaymentAmount())))
                .paymentStatusLabel(toPaymentStatusLabel(resolvedStatus))
                .paymentMethodLabel(toPaymentMethodLabel(payment.getPayMethod()))
                .paidAt(resolvePaymentDate(payment))
                .detail(buildPaymentDetail(payment, resolvedStatus))
                .build();
    }

    private PaymentPayMethod parsePayMethod(String payMethod) {
        try {
            return PaymentPayMethod.valueOf(payMethod);
        } catch (IllegalArgumentException | NullPointerException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "지원하지 않는 결제 수단입니다. payMethod=" + payMethod);
        }
    }

    private String resolvePaymentStatus(Payment payment) {
        if (payment.getPaymentStatus() == PaymentStatus.REFUNDED || defaultLong(payment.getRefundAmount()) > 0) {
            return "REFUNDED";
        }
        return payment.getPaymentStatus().name();
    }

    private String toPaymentMethodLabel(PaymentPayMethod method) {
        if (method == null) {
            return null;
        }
        return switch (method) {
        case CARD -> "카드";
        case BANK_TRANSFER -> "계좌이체";
        case VIRTUAL_ACCOUNT -> "가상계좌";
        case MOBILE -> "휴대폰";
        case EASY_PAY -> "간편결제";
        };
    }

    private String toPaymentStatusLabel(String status) {
        return switch (status) {
        case "PAID" -> "결제 완료";
        case "REFUNDED" -> "환불 완료";
        case "READY" -> "결제 대기";
        case "FAILED" -> "결제 실패";
        case "CANCELED" -> "결제 취소";
        case "PARTIAL_CANCELED" -> "부분 취소";
        default -> status;
        };
    }

    private String buildPaymentDetail(Payment payment, String status) {
        String method = toPaymentMethodLabel(payment.getPayMethod());
        String date = resolvePaymentDate(payment);
        if ("REFUNDED".equals(status) && method != null && date != null) {
            return method + " 환불 " + date;
        }
        if (method != null && date != null) {
            return method + " " + date;
        }
        return method != null ? method : date;
    }

    private String resolvePaymentDate(Payment payment) {
        if (payment.getApprovedAt() != null) {
            return DATE_FORMAT.format(payment.getApprovedAt());
        }
        if (payment.getCanceledAt() != null) {
            return DATE_FORMAT.format(payment.getCanceledAt());
        }
        return payment.getRegDate() != null ? DATE_FORMAT.format(payment.getRegDate()) : null;
    }

    private String formatWon(long amount) {
        return NUMBER_FORMAT.format(amount) + "원";
    }

    private long defaultLong(Long value) {
        return value != null ? value : 0L;
    }
}
