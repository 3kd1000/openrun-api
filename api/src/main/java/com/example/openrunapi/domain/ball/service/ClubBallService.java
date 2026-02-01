package com.example.openrunapi.domain.ball.service;

import com.example.openrunapi.domain.ball.model.BallTransactionType;
import com.example.openrunapi.domain.ball.model.ClubBallTransaction;
import com.example.openrunapi.domain.ball.model.dto.*;
import com.example.openrunapi.domain.ball.repository.ClubBallTransactionRepository;
import com.example.openrunapi.domain.club.model.Club;
import com.example.openrunapi.domain.club.model.ClubMember;
import com.example.openrunapi.domain.club.model.ClubMemberStatus;
import com.example.openrunapi.domain.club.repository.ClubMemberRepository;
import com.example.openrunapi.domain.club.repository.ClubRepository;
import com.example.openrunapi.domain.schedule.model.Schedule;
import com.example.openrunapi.domain.schedule.repository.ScheduleRepository;
import com.example.openrunapi.domain.user.model.User;
import com.example.openrunapi.domain.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class ClubBallService {

    private final ClubBallTransactionRepository transactionRepository;
    private final ClubRepository clubRepository;
    private final ClubMemberRepository clubMemberRepository;
    private final ScheduleRepository scheduleRepository;
    private final UserRepository userRepository;

    /**
     * 클럽 멤버 확인
     */
    private ClubMember requireMember(Long clubId, Long userId) {
        return clubMemberRepository.findByClubIdAndUserId(clubId, userId)
                .filter(m -> m.getStatus() == ClubMemberStatus.ACTIVE)
                .orElseThrow(() -> new SecurityException("클럽 멤버만 접근할 수 있습니다."));
    }

    /**
     * 관리자 권한 확인
     */
    private ClubMember requireAdmin(Long clubId, Long userId) {
        ClubMember member = requireMember(clubId, userId);
        if (!member.canManageSchedule()) {
            throw new SecurityException("운영진 이상만 가능합니다.");
        }
        return member;
    }

    /**
     * 공용구 현황 조회 - 모든 클럽원 가능
     */
    public BallSummaryResponse getBallSummary(Long clubId, Long userId) {
        log.info("Getting ball summary for clubId: {}, userId: {}", clubId, userId);

        if (!clubRepository.existsById(clubId)) {
            throw new EntityNotFoundException("해당 ID의 클럽을 찾을 수 없습니다: " + clubId);
        }
        requireMember(clubId, userId);

        // 보유자 목록 조회
        List<ClubMember> keepers = clubMemberRepository.findBallKeepersByClubId(clubId);
        List<BallKeeperResponse> keeperResponses = keepers.stream()
                .map(BallKeeperResponse::from)
                .collect(Collectors.toList());

        // 총 보유량
        int totalQuantity = clubMemberRepository.sumBallQuantityByClubId(clubId);

        // 이번 달 통계
        YearMonth currentMonth = YearMonth.now();
        LocalDateTime monthStart = currentMonth.atDay(1).atStartOfDay();
        LocalDateTime monthEnd = currentMonth.plusMonths(1).atDay(1).atStartOfDay();

        Integer monthlyUsed = transactionRepository.sumQuantityByTypeAndMonth(
                clubId, BallTransactionType.USE, monthStart, monthEnd);
        Integer monthlyAdded = transactionRepository.sumQuantityByTypeAndMonth(
                clubId, BallTransactionType.ADD, monthStart, monthEnd);

        return BallSummaryResponse.of(
                totalQuantity,
                keepers.size(),
                monthlyUsed != null ? monthlyUsed : 0,
                monthlyAdded != null ? monthlyAdded : 0,
                keeperResponses
        );
    }

    /**
     * 거래 내역 조회 (페이징) - 모든 클럽원 가능
     */
    public Page<BallTransactionResponse> getTransactions(Long clubId, Long userId, Pageable pageable) {
        log.info("Getting ball transactions for clubId: {}, userId: {}", clubId, userId);

        if (!clubRepository.existsById(clubId)) {
            throw new EntityNotFoundException("해당 ID의 클럽을 찾을 수 없습니다: " + clubId);
        }
        requireMember(clubId, userId);

        return transactionRepository.findByClubIdOrderByCreatedAtDesc(clubId, pageable)
                .map(BallTransactionResponse::from);
    }

    /**
     * 일정별 사용 내역 조회 - 모든 클럽원 가능
     */
    public List<BallTransactionResponse> getScheduleUsages(Long clubId, Long scheduleId, Long userId) {
        log.info("Getting schedule ball usages for clubId: {}, scheduleId: {}, userId: {}", clubId, scheduleId, userId);

        requireMember(clubId, userId);

        Schedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new EntityNotFoundException("해당 ID의 일정을 찾을 수 없습니다: " + scheduleId));

        if (!schedule.getClubId().equals(clubId)) {
            throw new SecurityException("다른 클럽의 일정은 조회할 수 없습니다.");
        }

        return transactionRepository.findByScheduleId(scheduleId).stream()
                .map(BallTransactionResponse::from)
                .collect(Collectors.toList());
    }

    /**
     * 공용구 입고 - ADMIN+ 가능
     */
    @Transactional
    public BallTransactionResponse addBalls(Long clubId, AddBallRequest request, Long userId) {
        log.info("Adding balls for clubId: {}, toMemberId: {}, quantity: {}", clubId, request.toMemberId(), request.quantity());

        Club club = clubRepository.findById(clubId)
                .orElseThrow(() -> new EntityNotFoundException("해당 ID의 클럽을 찾을 수 없습니다: " + clubId));

        requireAdmin(clubId, userId);
        User currentUser = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다."));

        ClubMember toMember = clubMemberRepository.findById(request.toMemberId())
                .orElseThrow(() -> new EntityNotFoundException("보유자를 찾을 수 없습니다: " + request.toMemberId()));

        if (!toMember.getClub().getId().equals(clubId)) {
            throw new SecurityException("다른 클럽의 멤버에게 입고할 수 없습니다.");
        }

        if (!toMember.getIsBallKeeper()) {
            throw new IllegalStateException("공용구 보유자로 지정된 멤버만 입고받을 수 있습니다.");
        }

        // 수량 증가
        toMember.addBalls(request.quantity());

        // 거래 기록 생성
        ClubBallTransaction transaction = ClubBallTransaction.createAddTransaction(
                club, toMember, request.quantity(), request.description(), currentUser
        );
        transactionRepository.save(transaction);

        return BallTransactionResponse.from(transaction);
    }

    /**
     * 공용구 배분 - ADMIN+ 가능
     */
    @Transactional
    public BallTransactionResponse distributeBalls(Long clubId, DistributeBallRequest request, Long userId) {
        log.info("Distributing balls for clubId: {}, from: {}, to: {}, quantity: {}",
                clubId, request.fromMemberId(), request.toMemberId(), request.quantity());

        Club club = clubRepository.findById(clubId)
                .orElseThrow(() -> new EntityNotFoundException("해당 ID의 클럽을 찾을 수 없습니다: " + clubId));

        requireAdmin(clubId, userId);
        User currentUser = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다."));

        if (request.fromMemberId().equals(request.toMemberId())) {
            throw new IllegalArgumentException("출발 보유자와 도착 보유자가 같을 수 없습니다.");
        }

        ClubMember fromMember = clubMemberRepository.findById(request.fromMemberId())
                .orElseThrow(() -> new EntityNotFoundException("출발 보유자를 찾을 수 없습니다."));
        ClubMember toMember = clubMemberRepository.findById(request.toMemberId())
                .orElseThrow(() -> new EntityNotFoundException("도착 보유자를 찾을 수 없습니다."));

        if (!fromMember.getClub().getId().equals(clubId) || !toMember.getClub().getId().equals(clubId)) {
            throw new SecurityException("다른 클럽의 멤버 간 배분은 불가능합니다.");
        }

        if (!fromMember.getIsBallKeeper() || !toMember.getIsBallKeeper()) {
            throw new IllegalStateException("공용구 보유자 간에만 배분이 가능합니다.");
        }

        // 수량 이동
        fromMember.useBalls(request.quantity());
        toMember.addBalls(request.quantity());

        // 거래 기록 생성
        ClubBallTransaction transaction = ClubBallTransaction.createDistributeTransaction(
                club, fromMember, toMember, request.quantity(), request.description(), currentUser
        );
        transactionRepository.save(transaction);

        return BallTransactionResponse.from(transaction);
    }

    /**
     * 공용구 사용 기록 - 본인(보유자) or ADMIN+ 가능
     */
    @Transactional
    public BallTransactionResponse useBalls(Long clubId, UseBallRequest request, Long userId) {
        log.info("Recording ball usage for clubId: {}, fromMemberId: {}, scheduleId: {}, quantity: {}",
                clubId, request.fromMemberId(), request.scheduleId(), request.quantity());

        Club club = clubRepository.findById(clubId)
                .orElseThrow(() -> new EntityNotFoundException("해당 ID의 클럽을 찾을 수 없습니다: " + clubId));

        ClubMember currentMember = requireMember(clubId, userId);
        User currentUser = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다."));

        ClubMember fromMember = clubMemberRepository.findById(request.fromMemberId())
                .orElseThrow(() -> new EntityNotFoundException("보유자를 찾을 수 없습니다."));

        // 권한 확인: 본인(보유자) or ADMIN+
        boolean isOwnBalls = fromMember.getUser().getId().equals(userId);
        boolean isAdmin = currentMember.canManageSchedule();

        if (!isOwnBalls && !isAdmin) {
            throw new SecurityException("본인의 공용구이거나 운영진 이상만 사용 기록이 가능합니다.");
        }

        if (!fromMember.getClub().getId().equals(clubId)) {
            throw new SecurityException("다른 클럽의 공용구는 사용할 수 없습니다.");
        }

        if (!fromMember.getIsBallKeeper()) {
            throw new IllegalStateException("공용구 보유자만 사용 기록이 가능합니다.");
        }

        Schedule schedule = scheduleRepository.findById(request.scheduleId())
                .orElseThrow(() -> new EntityNotFoundException("일정을 찾을 수 없습니다."));

        if (!schedule.getClubId().equals(clubId)) {
            throw new SecurityException("다른 클럽의 일정에는 사용할 수 없습니다.");
        }

        // 수량 차감
        fromMember.useBalls(request.quantity());

        // 거래 기록 생성
        ClubBallTransaction transaction = ClubBallTransaction.createUseTransaction(
                club, fromMember, schedule, request.quantity(), request.description(), currentUser
        );
        transactionRepository.save(transaction);

        return BallTransactionResponse.from(transaction);
    }

    /**
     * 보유자 지정/해제 - ADMIN+ 가능
     */
    @Transactional
    public void updateBallKeeper(Long clubId, Long memberId, UpdateBallKeeperRequest request, Long userId) {
        log.info("Updating ball keeper status for clubId: {}, memberId: {}, isBallKeeper: {}",
                clubId, memberId, request.isBallKeeper());

        if (!clubRepository.existsById(clubId)) {
            throw new EntityNotFoundException("해당 ID의 클럽을 찾을 수 없습니다: " + clubId);
        }

        requireAdmin(clubId, userId);

        ClubMember member = clubMemberRepository.findById(memberId)
                .orElseThrow(() -> new EntityNotFoundException("멤버를 찾을 수 없습니다: " + memberId));

        if (!member.getClub().getId().equals(clubId)) {
            throw new SecurityException("다른 클럽의 멤버는 수정할 수 없습니다.");
        }

        if (member.getStatus() != ClubMemberStatus.ACTIVE) {
            throw new IllegalStateException("활성 멤버만 보유자로 지정할 수 있습니다.");
        }

        // 보유자 해제 시 잔여 수량 확인
        if (!request.isBallKeeper() && member.getBallQuantity() > 0) {
            throw new IllegalStateException(
                    "보유 수량이 " + member.getBallQuantity() + "캔 있습니다. 먼저 배분 후 해제해주세요."
            );
        }

        member.updateBallKeeper(request.isBallKeeper());
    }

    /**
     * 사용 기록 삭제 - 본인(보유자) or ADMIN+ 가능
     * - USE 타입만 삭제 가능
     * - 삭제 시 보유자 수량 복원
     */
    @Transactional
    public void deleteTransaction(Long clubId, Long transactionId, Long userId) {
        log.info("Deleting ball transaction for clubId: {}, transactionId: {}, userId: {}",
                clubId, transactionId, userId);

        if (!clubRepository.existsById(clubId)) {
            throw new EntityNotFoundException("해당 ID의 클럽을 찾을 수 없습니다: " + clubId);
        }

        ClubMember currentMember = requireMember(clubId, userId);

        ClubBallTransaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new EntityNotFoundException("거래 기록을 찾을 수 없습니다: " + transactionId));

        if (!transaction.getClub().getId().equals(clubId)) {
            throw new SecurityException("다른 클럽의 거래 기록은 삭제할 수 없습니다.");
        }

        // USE 타입만 삭제 가능
        if (transaction.getTransactionType() != BallTransactionType.USE) {
            throw new IllegalStateException("사용 기록(USE)만 삭제할 수 있습니다.");
        }

        // 권한 확인: 본인(보유자) or ADMIN+
        ClubMember fromMember = transaction.getFromMember();
        boolean isOwnBalls = fromMember != null && fromMember.getUser().getId().equals(userId);
        boolean isAdmin = currentMember.canManageSchedule();

        if (!isOwnBalls && !isAdmin) {
            throw new SecurityException("본인의 사용 기록이거나 운영진 이상만 삭제가 가능합니다.");
        }

        // 수량 복원
        if (fromMember != null && fromMember.getIsBallKeeper()) {
            fromMember.addBalls(transaction.getQuantity());
        }

        // 거래 기록 삭제
        transactionRepository.delete(transaction);
    }

    /**
     * 공용구 수량 일괄 조정 - ADMIN+ 가능
     * - 재고관리용 배치 업데이트
     * - quantity는 차이값 (양수: 증가, 음수: 감소)
     */
    @Transactional
    public void batchAdjustQuantities(Long clubId, BatchAdjustBallRequest request, Long userId) {
        log.info("Batch adjusting ball quantities for clubId: {}, adjustments count: {}", clubId, request.adjustments().size());

        Club club = clubRepository.findById(clubId)
                .orElseThrow(() -> new EntityNotFoundException("해당 ID의 클럽을 찾을 수 없습니다: " + clubId));

        requireAdmin(clubId, userId);
        User currentUser = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다."));

        // 모든 조정 건을 한 트랜잭션으로 처리
        for (AdjustBallRequest adjustment : request.adjustments()) {
            if (adjustment.quantity() == 0) {
                continue; // 변경 없음
            }

            ClubMember member = clubMemberRepository.findById(adjustment.memberId())
                    .orElseThrow(() -> new EntityNotFoundException("멤버를 찾을 수 없습니다: " + adjustment.memberId()));

            if (!member.getClub().getId().equals(clubId)) {
                throw new SecurityException("다른 클럽의 멤버는 수정할 수 없습니다.");
            }

            if (!member.getIsBallKeeper()) {
                throw new IllegalStateException("공용구 보유자만 수량 조정이 가능합니다.");
            }

            // 수량 조정 (양수: 증가, 음수: 감소)
            if (adjustment.quantity() > 0) {
                member.addBalls(adjustment.quantity());
            } else {
                member.useBalls(Math.abs(adjustment.quantity()));
            }

            // 거래 기록 생성
            ClubBallTransaction transaction = ClubBallTransaction.createAdjustTransaction(
                    club, member, adjustment.quantity(), adjustment.description(), currentUser
            );
            transactionRepository.save(transaction);
        }
    }
}
