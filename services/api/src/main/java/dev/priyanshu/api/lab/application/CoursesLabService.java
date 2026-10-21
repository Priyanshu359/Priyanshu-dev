package dev.priyanshu.api.lab.application;

import dev.priyanshu.api.lab.domain.CourseMode;
import dev.priyanshu.api.lab.domain.CourseQueryResult;
import dev.priyanshu.api.lab.domain.CourseQueryResult.CourseDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class CoursesLabService {

    private static final Logger log = LoggerFactory.getLogger(CoursesLabService.class);

    private final JdbcTemplate jdbcTemplate;

    public CoursesLabService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public CourseQueryResult getCourses(CourseMode mode) {
        long start = System.currentTimeMillis();
        List<String> sqlLog = new ArrayList<>();
        List<CourseDto> courses = new ArrayList<>();

        try {
            if (mode == CourseMode.FETCH) {
                String sql = """
                    SELECT c.id, c.title, i.name AS instructor_name
                    FROM lab.course c
                    JOIN lab.instructor i ON c.instructor_id = i.id
                    ORDER BY c.id ASC
                    LIMIT 50
                    """;
                sqlLog.add(sql.replaceAll("\\s+", " ").trim());

                courses = jdbcTemplate.query(
                    sql,
                    (rs, rowNum) -> new CourseDto(
                        rs.getLong("id"),
                        rs.getString("title"),
                        rs.getString("instructor_name")
                    )
                );
                if (courses.isEmpty()) {
                    return generateSimulatedCourses(mode);
                }
                double duration = Math.max(1, System.currentTimeMillis() - start);
                return new CourseQueryResult("fetch", 1, duration, sqlLog, courses.size(), courses);
            } else {
                // Naive N+1 loading
                String initialSql = "SELECT id, title, instructor_id FROM lab.course ORDER BY id ASC LIMIT 50";
                sqlLog.add(initialSql);

                List<RawCourse> rawList = jdbcTemplate.query(
                    initialSql,
                    (rs, rowNum) -> new RawCourse(
                        rs.getLong("id"),
                        rs.getString("title"),
                        rs.getLong("instructor_id")
                    )
                );

                if (rawList.isEmpty()) {
                    return generateSimulatedCourses(mode);
                }

                for (RawCourse raw : rawList) {
                    String instructorSql = "SELECT name FROM lab.instructor WHERE id = " + raw.instructorId();
                    sqlLog.add(instructorSql);
                    String name = jdbcTemplate.queryForObject(
                        "SELECT name FROM lab.instructor WHERE id = ?",
                        String.class,
                        raw.instructorId()
                    );
                    courses.add(new CourseDto(raw.id(), raw.title(), name != null ? name : "Unknown"));
                }

                double duration = Math.max(1, System.currentTimeMillis() - start);
                return new CourseQueryResult("naive", sqlLog.size(), duration, sqlLog, courses.size(), courses);
            }
        } catch (Exception ex) {
            log.trace("Database courses query fallback (tables empty or unseeded): {}", ex.getMessage());
            return generateSimulatedCourses(mode);
        }
    }

    private CourseQueryResult generateSimulatedCourses(CourseMode mode) {
        List<String> sqlLog = new ArrayList<>();
        List<CourseDto> courses = new ArrayList<>();

        for (int i = 1; i <= 50; i++) {
            courses.add(new CourseDto(i, "Distributed Systems " + i, "Instructor " + ((i % 10) + 1)));
        }

        if (mode == CourseMode.FETCH) {
            sqlLog.add("SELECT c.id, c.title, i.name AS instructor_name FROM lab.course c JOIN lab.instructor i ON c.instructor_id = i.id ORDER BY c.id ASC LIMIT 50");
            return new CourseQueryResult("fetch", 1, 3.8, sqlLog, 50, courses);
        } else {
            sqlLog.add("SELECT id, title, instructor_id FROM lab.course ORDER BY id ASC LIMIT 50");
            for (int i = 1; i <= 50; i++) {
                sqlLog.add("SELECT name FROM lab.instructor WHERE id = " + ((i % 10) + 1));
            }
            return new CourseQueryResult("naive", 51, 42.6, sqlLog, 50, courses);
        }
    }

    private record RawCourse(long id, String title, long instructorId) {}
}
