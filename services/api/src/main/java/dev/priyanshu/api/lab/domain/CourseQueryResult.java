package dev.priyanshu.api.lab.domain;

import java.util.List;

public record CourseQueryResult(
    String mode,
    int queryCount,
    long durationMs,
    List<String> sqlLog,
    int coursesCount,
    List<CourseDto> courses
) {
    public record CourseDto(long id, String title, String instructorName) {}
}
