package dev.priyanshu.api.lab.adapter.in.web;

import dev.priyanshu.api.lab.application.FlashSaleLabService;
import dev.priyanshu.api.lab.domain.FlashSaleOrderResult;
import dev.priyanshu.api.lab.domain.FlashSaleSimulationResult;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/lab/flash-sale")
public class FlashSaleLabController {

    private final FlashSaleLabService flashSaleLabService;

    public FlashSaleLabController(FlashSaleLabService flashSaleLabService) {
        this.flashSaleLabService = flashSaleLabService;
    }

    @GetMapping("/stock")
    public ResponseEntity<Map<String, Object>> getStock() {
        int stock = flashSaleLabService.getStock();
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
        return ResponseEntity.ok(result);
    }

    @PostMapping("/reset")
    public ResponseEntity<Map<String, Object>> reset(
        @RequestParam(defaultValue = "10") int stock
    ) {
        flashSaleLabService.resetStock(stock);
        return ResponseEntity.ok(Map.of(
            "message", "Stock reset successfully",
            "stock", stock
        ));
    }
}
