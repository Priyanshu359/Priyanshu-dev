package dev.priyanshu.api;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
    "spring.flyway.enabled=false",
    "priyanshu.outbox.polling-interval-ms=600000"
})
class ApiApplicationTests {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private StringRedisTemplate redisTemplate;

    @MockitoBean
    private JdbcTemplate jdbcTemplate;

    @MockitoBean
    private JavaMailSender mailSender;

    @Test
    void contextLoads() {
    }

    @Test
    void healthEndpointReturnsUp() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    void rootEndpointReturnsFoundationOk() throws Exception {
        mockMvc.perform(get("/"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("foundation ok"));
    }

    @Test
    void profileEndpointReturnsCompactForCurl() throws Exception {
        mockMvc.perform(get("/me").header("User-Agent", "curl/8.7.1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Priyanshu Sinha"));
    }

    @Test
    void hireMeEndpointReturnsUsageInstructions() throws Exception {
        mockMvc.perform(get("/hire-me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.endpoint").value("POST /hire-me"));
    }
}
