package dev.priyanshu.api.lab.domain;

import java.util.List;

public record QueuePipelineResult(
    List<QueueMessage> mainQueue,
    List<QueueMessage> retryQueue,
    List<QueueMessage> dlq,
    List<QueueMessage> processed,
    int totalProcessed,
    int totalInDlq
) {}
