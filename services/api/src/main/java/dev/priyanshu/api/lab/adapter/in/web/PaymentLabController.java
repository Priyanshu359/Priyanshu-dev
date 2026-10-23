package dev.priyanshu.api.lab.adapter.in.web;

import dev.priyanshu.api.lab.application.PaymentLabService;
import dev.priyanshu.api.lab.domain.PaymentChargeRequest;
import dev.priyanshu.api.lab.domain.PaymentChargeResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/lab/payments")
public class PaymentLabController {

    private static final Logger log = LoggerFactory.getLogger(PaymentLabController.class);

    private final PaymentLabService paymentLabService;

    public PaymentLabController(PaymentLabService paymentLabService) {
        this.paymentLabService = paymentLabService;
    }

    @PostMapping("/charge")
    public ResponseEntity<PaymentChargeResult> charge(
        @RequestHeader(value = "Idempotency-Key", required = false) String headerKey,
        @RequestParam(defaultValue = "true") boolean enableIdempotency,
        @RequestBody(required = false) PaymentChargeRequest body
    ) {
        String key = (headerKey != null && !headerKey.isBlank())
            ? headerKey
            : (body != null ? body.idempotencyKey() : null);

        long amount = (body != null && body.amountCents() > 0) ? body.amountCents() : 25_000; // $250.00
        String customer = (body != null && body.customerId() != null) ? body.customerId() : "cust_9921";
        String currency = (body != null && body.currency() != null) ? body.currency() : "USD";

        PaymentChargeRequest request = new PaymentChargeRequest(key, customer, amount, currency);
        PaymentChargeResult result = paymentLabService.processPayment(request, enableIdempotency);

        log.info("[LAB-PAYMENTS] POST /charge key='{}' idempotency={} -> status={}, replayed={}, balance={}, latency={}ms",
            key, enableIdempotency, result.status(), result.replayed(), "$" + (paymentLabService.getBalanceCents() / 100.0), result.latencyMs());

        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Idempotent-Replay", String.valueOf(result.replayed()));
        headers.set("X-Response-Time", result.latencyMs() + "ms");

        return ResponseEntity.ok()
            .headers(headers)
            .body(result);
    }

    @GetMapping("/audit")
    public ResponseEntity<Map<String, Object>> getAudit() {
        List<PaymentChargeResult> auditLog = paymentLabService.getAuditLog();
        long balance = paymentLabService.getBalanceCents();
        return ResponseEntity.ok(Map.of(
            "balanceCents", balance,
            "balanceFormatted", "$" + (balance / 100.0),
            "totalTransactions", auditLog.size(),
            "history", auditLog
        ));
    }

    @PostMapping("/reset")
    public ResponseEntity<Map<String, Object>> reset() {
        paymentLabService.reset();
        log.info("[LAB-PAYMENTS] POST /reset -> ledger reset to $1,000.00");
        return ResponseEntity.ok(Map.of("message", "Payment demo reset to initial $1000 balance"));
    }
}
