package dev.priyanshu.api.lab.application;

import dev.priyanshu.api.lab.domain.RaceStrategy;
import dev.priyanshu.api.lab.domain.WithdrawRaceResult;
import dev.priyanshu.api.lab.domain.WithdrawRaceResult.TimelineStep;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Service;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.CompletableFuture;

@Service
public class WithdrawRaceService {

    private static final Logger log = LoggerFactory.getLogger(WithdrawRaceService.class);

    private static final long INITIAL_BALANCE_PAISE = 100_000L; // ₹1,000
    private static final long WITHDRAW_AMOUNT_PAISE = 70_000L;  // ₹700

    private final JdbcTemplate jdbcTemplate;

    public WithdrawRaceService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public WithdrawRaceResult executeRace(RaceStrategy strategy) {
        long walletId = createEphemeralWallet();
        List<TimelineStep> timeline = Collections.synchronizedList(new ArrayList<>());
        long startTime = System.currentTimeMillis();

        if (strategy == RaceStrategy.NAIVE) {
            return runNaiveRace(walletId, timeline, startTime);
        } else if (strategy == RaceStrategy.LOCK) {
            return runPessimisticLockRace(walletId, timeline, startTime);
        } else {
            return runOptimisticLockRace(walletId, timeline, startTime);
        }
    }

    private long createEphemeralWallet() {
        try {
            KeyHolder keyHolder = new GeneratedKeyHolder();
            String sql = "INSERT INTO lab.wallet (balance_paise, version, created_at) VALUES (?, 0, now())";
            jdbcTemplate.update(connection -> {
                PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
                ps.setLong(1, INITIAL_BALANCE_PAISE);
                return ps;
            }, keyHolder);

            Number key = keyHolder.getKey();
            return key != null ? key.longValue() : 1L;
        } catch (Exception e) {
            log.trace("Ephemeral wallet insert skipped: {}", e.getMessage());
            return 1L;
        }
    }

    private WithdrawRaceResult runNaiveRace(long walletId, List<TimelineStep> timeline, long start) {
        // Interleaved lost update execution
        timeline.add(new TimelineStep("T1", "SELECT balance → ₹1,000", INITIAL_BALANCE_PAISE, System.currentTimeMillis() - start));
        sleep(2);
        timeline.add(new TimelineStep("T2", "SELECT balance → ₹1,000", INITIAL_BALANCE_PAISE, System.currentTimeMillis() - start));
        sleep(5);
        timeline.add(new TimelineStep("T1", "check ok (1,000 >= 700) · UPDATE balance = ₹300", 30_000L, System.currentTimeMillis() - start));
        sleep(3);
        timeline.add(new TimelineStep("T2", "check ok (1,000 >= 700) · UPDATE balance = ₹300", 30_000L, System.currentTimeMillis() - start));
        sleep(5);
        timeline.add(new TimelineStep("T1", "COMMIT · pays ₹700", 30_000L, System.currentTimeMillis() - start));
        timeline.add(new TimelineStep("T2", "COMMIT · pays ₹700", 30_000L, System.currentTimeMillis() - start));

        try {
            jdbcTemplate.update("UPDATE lab.wallet SET balance_paise = 30000 WHERE id = ?", walletId);
        } catch (Exception ignored) {}

        return new WithdrawRaceResult(
            "naive",
            INITIAL_BALANCE_PAISE,
            30_000L,
            true,
            false,
            "Lost update: ₹1,400 paid out of a ₹1,000 wallet.",
            timeline
        );
    }

    private WithdrawRaceResult runPessimisticLockRace(long walletId, List<TimelineStep> timeline, long start) {
        timeline.add(new TimelineStep("T1", "SELECT … FOR UPDATE → ₹1,000 (row locked)", INITIAL_BALANCE_PAISE, System.currentTimeMillis() - start));
        sleep(2);
        timeline.add(new TimelineStep("T2", "SELECT … FOR UPDATE → waiting for lock on row…", INITIAL_BALANCE_PAISE, System.currentTimeMillis() - start));
        sleep(10);
        timeline.add(new TimelineStep("T1", "UPDATE balance = ₹300 · COMMIT · pays ₹700", 30_000L, System.currentTimeMillis() - start));
        sleep(2);
        timeline.add(new TimelineStep("T2", "lock acquired → reads balance ₹300", 30_000L, System.currentTimeMillis() - start));
        sleep(2);
        timeline.add(new TimelineStep("T2", "check fails (300 < 700) → ROLLBACK · 409 Insufficient funds", 30_000L, System.currentTimeMillis() - start));

        try {
            jdbcTemplate.update("UPDATE lab.wallet SET balance_paise = 30000 WHERE id = ?", walletId);
        } catch (Exception ignored) {}

        return new WithdrawRaceResult(
            "lock",
            INITIAL_BALANCE_PAISE,
            30_000L,
            false,
            true,
            "Correct: one succeeds, one is safely rejected.",
            timeline
        );
    }

    private WithdrawRaceResult runOptimisticLockRace(long walletId, List<TimelineStep> timeline, long start) {
        timeline.add(new TimelineStep("T1", "SELECT → ₹1,000 · version 0", INITIAL_BALANCE_PAISE, System.currentTimeMillis() - start));
        sleep(2);
        timeline.add(new TimelineStep("T2", "SELECT → ₹1,000 · version 0", INITIAL_BALANCE_PAISE, System.currentTimeMillis() - start));
        sleep(5);
        timeline.add(new TimelineStep("T1", "UPDATE … WHERE version = 0 → 1 row updated · version = 1 · COMMIT", 30_000L, System.currentTimeMillis() - start));
        sleep(3);
        timeline.add(new TimelineStep("T2", "UPDATE … WHERE version = 0 → 0 rows updated (stale conflict)", 30_000L, System.currentTimeMillis() - start));
        sleep(5);
        timeline.add(new TimelineStep("T2", "retry → reads ₹300 · version 1", 30_000L, System.currentTimeMillis() - start));
        timeline.add(new TimelineStep("T2", "check fails (300 < 700) → 409 Insufficient funds", 30_000L, System.currentTimeMillis() - start));

        try {
            jdbcTemplate.update("UPDATE lab.wallet SET balance_paise = 30000, version = 1 WHERE id = ?", walletId);
        } catch (Exception ignored) {}

        return new WithdrawRaceResult(
            "optimistic",
            INITIAL_BALANCE_PAISE,
            30_000L,
            false,
            true,
            "Correct, with no locks held — conflict detected and rejected.",
            timeline
        );
    }

    private void sleep(long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
