package dev.priyanshu.api.contact.application;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.Map;

public record ContactRequest(
    @NotBlank(message = "Contact type is required (recruiter, client, student)")
    String type,

    @NotBlank(message = "Name is required")
    @Size(max = 100, message = "Name must not exceed 100 characters")
    String name,

    @NotBlank(message = "Email is required")
    @Email(message = "Must be a valid email address")
    @Size(max = 255, message = "Email must not exceed 255 characters")
    String email,

    @NotBlank(message = "Message is required")
    @Size(max = 5000, message = "Message must not exceed 5000 characters")
    String message,

    Map<String, Object> details,

    String turnstileToken
) {
    public ContactRequest(String type, String name, String email, String message, Map<String, Object> details) {
        this(type, name, email, message, details, null);
    }
}
