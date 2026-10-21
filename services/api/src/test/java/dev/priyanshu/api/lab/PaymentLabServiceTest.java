package dev.priyanshu.api.lab;

import com.fasterxml.jackson.databind.ObjectMapper;
import dev.priyanshu.api.lab.application.PaymentLabService;
import dev.priyanshu.api.lab.domain.PaymentChargeRequest;
import dev.priyanshu.api.lab.domain.PaymentChargeResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.util.concurrent.CompletableFuture;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

class PaymentLabServiceTest {

    private StringRedisTemplate redisTemplate;
    private ObjectMapper objectMapper;
    private PaymentLabService paymentLabService;

    @BeforeEach
    void setUp() {
        redisTemplate = Mockito.mock(StringRedisTemplate.class);
        ValueOperations<String, String> ops = Mockito.mock(ValueOperations.class);
        when(redisTemplate.opsForValue()).thenReturn(ops);
        // Default Redis returns null so it falls back cleanly to local in-flight memory store
        when(ops.get(any())).thenReturn(null);

        objectMapper = new ObjectMapper();
        paymentLabService = new PaymentLabService(redisTemplate, objectMapper);
    }

    @Test
    void protectedRapidDoubleClickChargesOnlyOnce() throws Exception {
        PaymentChargeRequest request = new PaymentChargeRequest("pay_intent_shared_1", "cust_99", 25_000, "USD");

        // Fire two concurrent calls with identical key and idempotency enabled
        CompletableFuture<PaymentChargeResult> f1 = CompletableFuture.supplyAsync(() ->
            paymentLabService.processPayment(request, true)
        );
        Thread.sleep(15);
        CompletableFuture<PaymentChargeResult> f2 = CompletableFuture.supplyAsync(() ->
            paymentLabService.processPayment(request, true)
        );

        PaymentChargeResult r1 = f1.get();
        PaymentChargeResult r2 = f2.get();

        assertThat(paymentLabService.getBalanceCents()).isEqualTo(75_000); // Charged ONLY ONCE ($250 deducted from $1000)

        // One must be fresh, one must be replayed
        boolean oneReplayed = (r1.replayed() && !r2.replayed()) || (!r1.replayed() && r2.replayed());
        assertThat(oneReplayed).isTrue();
    }

    @Test
    void unprotectedRapidDoubleClickChargesTwice() throws Exception {
        PaymentChargeRequest request = new PaymentChargeRequest("pay_intent_unprotected_2", "cust_99", 25_000, "USD");

        // Fire two concurrent calls with idempotency disabled
        CompletableFuture<PaymentChargeResult> f1 = CompletableFuture.supplyAsync(() ->
            paymentLabService.processPayment(request, false)
        );
        Thread.sleep(15);
        CompletableFuture<PaymentChargeResult> f2 = CompletableFuture.supplyAsync(() ->
            paymentLabService.processPayment(request, false)
        );

        PaymentChargeResult r1 = f1.get();
        PaymentChargeResult r2 = f2.get();

        assertThat(paymentLabService.getBalanceCents()).isEqualTo(50_000); // Charged TWICE ($500 deducted from $1000)
        assertThat(r1.replayed()).isFalse();
        assertThat(r2.replayed()).isFalse();
    }
}
