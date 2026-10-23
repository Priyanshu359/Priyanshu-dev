package dev.priyanshu.api.contact.adapter.out.notification;

import dev.priyanshu.api.contact.application.NotificationPort;
import dev.priyanshu.api.contact.domain.ContactMessage;
import dev.priyanshu.api.platform.PlatformProperties;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.Map;

@Component
public class EmailNotificationAdapter implements NotificationPort {

    private static final Logger log = LoggerFactory.getLogger(EmailNotificationAdapter.class);

    private final PlatformProperties properties;
    private final JavaMailSender mailSender;

    public EmailNotificationAdapter(PlatformProperties properties, JavaMailSender mailSender) {
        this.properties = properties;
        this.mailSender = mailSender;
    }

    @Override
    public void sendNotification(ContactMessage message) {
        var notifConfig = properties.getNotification();
        if (notifConfig.isLogOnly()) {
            log.info("===> [CONTACT NOTIFICATION (LOG-ONLY)] From: {} ({}) [{}] | Message: {} | Details: {}",
                message.name(), message.email(), message.type().getValue(), message.message(), message.details());
            return;
        }

        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED, StandardCharsets.UTF_8.name());

            helper.setTo(notifConfig.getToEmail());
            helper.setFrom(notifConfig.getFromEmail(), "Priyanshu Portfolio");
            helper.setReplyTo(message.email(), message.name());

            String typeUpper = message.type().getValue().toUpperCase();
            String subject = "New Contact Inquiry [" + typeUpper + "] from " + message.name();
            helper.setSubject(subject);

            String textBody = buildPlainText(message);
            String htmlBody = buildHtml(message);

            helper.setText(textBody, htmlBody);

            mailSender.send(mimeMessage);
            log.info("Contact notification email dispatched successfully to {}", notifConfig.getToEmail());
        } catch (Exception e) {
            log.error("Failed to send contact notification email via SMTP, falling back to log: {}", e.getMessage(), e);
            log.info("===> [FALLBACK LOG] From: {} ({}) [{}] Message: {}",
                message.name(), message.email(), message.type(), message.message());
        }
    }

    private String buildPlainText(ContactMessage message) {
        StringBuilder sb = new StringBuilder();
        sb.append("New ").append(message.type().getValue().toUpperCase()).append(" Inquiry\n");
        sb.append("========================================\n\n");
        sb.append("Sender:  ").append(message.name()).append(" <").append(message.email()).append(">\n");
        sb.append("Type:    ").append(message.type().getValue()).append("\n");

        if (message.details() != null && !message.details().isEmpty()) {
            for (Map.Entry<String, Object> entry : message.details().entrySet()) {
                if (entry.getValue() != null && !entry.getValue().toString().isBlank()) {
                    String label = formatDetailLabel(entry.getKey());
                    sb.append(String.format("%-8s %s\n", label + ":", entry.getValue()));
                }
            }
        }

        sb.append("\nMessage:\n");
        sb.append("----------------------------------------\n");
        sb.append(message.message()).append("\n");
        sb.append("----------------------------------------\n\n");
        sb.append("Reply directly to this email to respond to ").append(message.name()).append(".\n");
        return sb.toString();
    }

    private String buildHtml(ContactMessage message) {
        String typeLabel = switch (message.type().getValue().toLowerCase()) {
            case "recruiter" -> "Recruiter Inquiry";
            case "client" -> "Freelance / Client Inquiry";
            case "student" -> "Developer / Student Chat";
            default -> message.type().getValue().toUpperCase() + " Inquiry";
        };

        String badgeBg = switch (message.type().getValue().toLowerCase()) {
            case "recruiter" -> "#0284c7";
            case "client" -> "#16a34a";
            case "student" -> "#d97706";
            default -> "#475569";
        };

        StringBuilder detailsRows = new StringBuilder();
        if (message.details() != null && !message.details().isEmpty()) {
            for (Map.Entry<String, Object> entry : message.details().entrySet()) {
                if (entry.getValue() != null && !entry.getValue().toString().isBlank()) {
                    String label = escapeHtml(formatDetailLabel(entry.getKey()));
                    String val = escapeHtml(entry.getValue().toString());
                    detailsRows.append("""
                        <tr>
                            <td style="padding: 6px 0; color: #64748b; font-size: 13px; font-weight: 500; width: 130px; vertical-align: top;">%s</td>
                            <td style="padding: 6px 0; color: #0f172a; font-size: 14px; font-weight: 600; vertical-align: top;">%s</td>
                        </tr>
                        """.formatted(label, val));
                }
            }
        }

        String safeName = escapeHtml(message.name());
        String safeEmail = escapeHtml(message.email());
        String safeMessage = escapeHtml(message.message()).replace("\n", "<br/>");

        return """
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 24px 12px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
              <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center">
                    <table role="presentation" width="100%%" style="max-width: 580px; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);" cellspacing="0" cellpadding="0" border="0">
                      
                      <!-- Header -->
                      <tr>
                        <td style="background-color: #090d16; padding: 24px 28px;">
                          <span style="display: inline-block; background-color: %s; color: #ffffff; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; padding: 4px 10px; border-radius: 9999px;">
                            %s
                          </span>
                          <h1 style="margin: 14px 0 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.3;">
                            %s
                          </h1>
                        </td>
                      </tr>

                      <!-- Content Body -->
                      <tr>
                        <td style="padding: 28px;">
                          
                          <!-- Sender Details Table -->
                          <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" border="0" style="border-bottom: 1px solid #f1f5f9; padding-bottom: 18px; margin-bottom: 20px;">
                            <tr>
                              <td style="padding: 6px 0; color: #64748b; font-size: 13px; font-weight: 500; width: 130px; vertical-align: top;">Sender</td>
                              <td style="padding: 6px 0; color: #0f172a; font-size: 14px; font-weight: 600; vertical-align: top;">
                                %s &nbsp;&middot;&nbsp; <a href="mailto:%s" style="color: #2563eb; text-decoration: none; font-weight: 500;">%s</a>
                              </td>
                            </tr>
                            %s
                          </table>

                          <!-- Message Box -->
                          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #090d16; border-radius: 8px; padding: 18px 20px; margin-bottom: 24px;">
                            <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 8px;">
                              Message
                            </div>
                            <div style="font-size: 15px; color: #0f172a; line-height: 1.6;">
                              %s
                            </div>
                          </div>

                          <!-- Action Button -->
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                              <td style="border-radius: 6px; background-color: #090d16;">
                                <a href="mailto:%s?subject=Re:%%20Inquiry%%20via%%20priyanshusinha.dev" style="display: inline-block; padding: 12px 22px; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; border-radius: 6px;">
                                  Reply to %s &rarr;
                                </a>
                              </td>
                            </tr>
                          </table>

                        </td>
                      </tr>

                      <!-- Footer -->
                      <tr>
                        <td style="padding: 16px 28px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8; text-align: center;">
                          Dispatched via transactional event pipeline &middot; <strong>priyanshusinha.dev</strong>
                        </td>
                      </tr>

                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """.formatted(
                badgeBg,
                typeLabel,
                safeName,
                safeName,
                safeEmail,
                safeEmail,
                detailsRows.toString(),
                safeMessage,
                safeEmail,
                safeName
            );
    }

    private String formatDetailLabel(String key) {
        return switch (key) {
            case "company" -> "Company";
            case "role" -> "Role";
            case "projectType" -> "Project Type";
            case "timeline" -> "Timeline";
            case "stage" -> "Background";
            case "topic" -> "Topic";
            default -> {
                if (key.length() <= 1) yield key.toUpperCase();
                yield Character.toUpperCase(key.charAt(0)) + key.substring(1);
            }
        };
    }

    private String escapeHtml(String input) {
        if (input == null) return "";
        return input.replace("&", "&amp;")
                    .replace("<", "&lt;")
                    .replace(">", "&gt;")
                    .replace("\"", "&quot;")
                    .replace("'", "&#39;");
    }
}
