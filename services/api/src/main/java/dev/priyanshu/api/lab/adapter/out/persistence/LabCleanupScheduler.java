package dev.priyanshu.api.lab.adapter.out.persistence;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class LabCleanupScheduler {

    private static final Logger log = LoggerFactory.getLogger(LabCleanupScheduler.class);

    private final JdbcTemplate jdbcTemplate;

    public LabCleanupScheduler(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Deletes ephemeral lab wallets older than 1 hour.
     * Runs every 15 minutes to keep ephemeral test data clean.
     */
    @Scheduled(cron = "0 */15 * * * *")
    public void cleanupOldEphemeralWallets() {
        try {
            int deleted = jdbcTemplate.update(
                "DELETE FROM lab.wallet WHERE created_at < NOW() - INTERVAL '1 hour'"
            );
            if (deleted > 0) {
                log.info("Lab cleanup: Purged {} ephemeral wallets older than 1 hour", deleted);
            }
        } catch (Exception e) {
            log.debug("Lab cleanup skipped or table not present: {}", e.getMessage());
        }
    }
}
