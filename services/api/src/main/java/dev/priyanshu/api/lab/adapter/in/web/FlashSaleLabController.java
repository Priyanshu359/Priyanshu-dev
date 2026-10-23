package dev.priyanshu.api.lab.adapter.in.web;

import dev.priyanshu.api.lab.application.FlashSaleLabService;
import dev.priyanshu.api.lab.domain.FlashSaleOrderResult;
import dev.priyanshu.api.lab.domain.FlashSaleSimulationResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/lab/flash-sale")
public class FlashSaleLabController {

    private static final Logger log = LoggerFactory.getLogger(FlashSaleLabController.class);

    private final FlashSaleLabService flashSaleLabService;

    public FlashSaleLabController(FlashSaleLabService flashSaleLabService) {
        this.flashSaleLabService = flashSaleLabService;
    }

    @GetMapping("/stock")
    public ResponseEntity<Map<String, Object>> getStock() {
        int stock = flashSaleLabService.getStock();
        log.info("[LAB-FLASH-SALE] GET /stock -> currentStock={}", stock);
        return ResponseEntity.ok(Map.of(
            "stock", stock,
            "status", stock > 0 ? "IN_STOCK" : "SOLD_OUT"
        ));
    }

    @PostMapping("/buy")
    public ResponseEntity<FlashSaleOrderResult> buy(
        @RequestParam(defaultValue = "user_anon") String userId,
        @RequestParam(defaultValue = "atomic") String strategy
    ) {
        FlashSaleOrderResult result = flashSaleLabService.buyItem(userId, strategy);
        log.info("[LAB-FLASH-SALE] POST /buy user='{}', strategy='{}' -> success={}, remainingStock={}, message='{}'",
            userId, strategy, result.success(), result.remainingStock(), result.message());
        return ResponseEntity.ok(result);
    }

    @PostMapping("/simulate")
    public ResponseEntity<FlashSaleSimulationResult> simulate(
        @RequestBody(required = false) Map<String, Object> body
    ) {
        String strategy = (body != null && body.containsKey("strategy")) ? body.get("strategy").toString() : "atomic";
        int concurrency = (body != null && body.containsKey("concurrency")) ? ((Number) body.get("concurrency")).intValue() : 50;
        int stock = (body != null && body.containsKey("stock")) ? ((Number) body.get("stock")).intValue() : 10;

        FlashSaleSimulationResult result = flashSaleLabService.runSimulation(strategy, concurrency, stock);

        log.info("[LAB-FLASH-SALE] POST /simulate strategy='{}', concurrency={}, stock={} -> successful={}, failed={}, oversoldAmount={}, finalStock={}",
            strategy, concurrency, stock, result.successfulOrders(), result.failedOrders(), result.oversoldAmount(), result.finalStock());

        return ResponseEntity.ok(result);
    }

    @PostMapping("/reset")
    public ResponseEntity<Map<String, Object>> reset(
        @RequestParam(defaultValue = "10") int stock
    ) {
        flashSaleLabService.resetStock(stock);
        log.info("[LAB-FLASH-SALE] POST /reset -> stock reset to {}", stock);
        return ResponseEntity.ok(Map.of(
            "message", "Stock reset successfully",
            "stock", stock
        ));
    }
}
