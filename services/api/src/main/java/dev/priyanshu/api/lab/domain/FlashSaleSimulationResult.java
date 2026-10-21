package dev.priyanshu.api.lab.domain;

import java.util.List;

public record FlashSaleSimulationResult(
    String strategy,
    int initialStock,
    int concurrentRequests,
    int successfulOrders,
    int failedOrders,
    int oversoldAmount,
    int finalStock,
    boolean oversold,
    List<FlashSaleEvent> timeline
) {
    public record FlashSaleEvent(
        String orderId,
        String userId,
        boolean success,
        int stockObserved,
        long offsetMs,
        String note
    ) {}
}
