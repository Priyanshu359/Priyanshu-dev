package dev.priyanshu.api.lab.domain;

import java.util.List;

public record WithdrawRaceResult(
    String strategy,
    long initialBalancePaise,
    long finalBalancePaise,
    boolean lostUpdate,
    boolean ok,
    String summary,
    List<TimelineStep> timeline
) {
    public record TimelineStep(String who, String text, long balancePaise, long timestampMs) {}
}
