package dev.priyanshu.api.contact.application;

import java.util.UUID;

public record ContactResponse(
    UUID id,
    String status,
    String message
) {}
