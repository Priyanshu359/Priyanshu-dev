package dev.priyanshu.api.lab.domain;

import java.util.List;
import java.util.Map;

public record ExplainResult(
    String strategy,
    String table,
    double executionTimeMs,
    double planningTimeMs,
    long rowsScanned,
    long rowsReturned,
    String nodeType,
    String planText,
    List<Map<String, Object>> rawJson
) {}
