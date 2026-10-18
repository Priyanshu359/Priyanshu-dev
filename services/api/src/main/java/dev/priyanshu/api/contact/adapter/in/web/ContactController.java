package dev.priyanshu.api.contact.adapter.in.web;

import dev.priyanshu.api.contact.application.ContactRequest;
import dev.priyanshu.api.contact.application.ContactResponse;
import dev.priyanshu.api.contact.application.ContactUseCase;
import dev.priyanshu.api.platform.adapter.in.web.RateLimitingFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class ContactController {

    private final ContactUseCase contactUseCase;

    public ContactController(ContactUseCase contactUseCase) {
        this.contactUseCase = contactUseCase;
    }

    @PostMapping(value = "/hire-me", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ContactResponse> submitHireMe(
            @Valid @RequestBody ContactRequest request,
            HttpServletRequest servletRequest) {
        String clientIp = RateLimitingFilter.extractClientIp(servletRequest);
        ContactResponse response = contactUseCase.submitContact(request, clientIp);
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(response);
    }

    @GetMapping(value = "/hire-me", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Object>> getHireMeInstructions() {
        Map<String, Object> instructions = Map.of(
            "endpoint", "POST /hire-me",
            "description", "Submit a freelance inquiry, hiring request, or direct engineering message straight from terminal.",
            "allowedTypes", Map.of(
                "recruiter", "Include details: { \"company\": \"...\", \"role\": \"...\" }",
                "client", "Include details: { \"projectType\": \"Full app|Backend|AI\", \"timeline\": \"Under a month|1-3 months|Flexible\" }",
                "student", "Include details: { \"stage\": \"Student|Working dev\", \"topic\": \"Backend chat|What I'm building\" }"
            ),
            "curlExample", """
                curl -X POST https://api.priyanshu.dev/hire-me \\
                  -H "Content-Type: application/json" \\
                  -d '{
                    "type": "client",
                    "name": "Jane Doe",
                    "email": "jane@example.com",
                    "message": "We need a distributed rate-limiting and Kafka streaming pipeline.",
                    "details": { "projectType": "Backend / APIs", "timeline": "1–3 months" }
                  }'
                """.stripIndent(),
            "limits", "Strictly rate-limited to 3 submissions per IP per hour. Duplicate content is automatically deduplicated."
        );
        return ResponseEntity.ok(instructions);
    }
}
