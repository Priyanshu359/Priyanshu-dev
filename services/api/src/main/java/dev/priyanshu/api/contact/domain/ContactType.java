package dev.priyanshu.api.contact.domain;

public enum ContactType {
    RECRUITER("recruiter"),
    CLIENT("client"),
    STUDENT("student");

    private final String value;

    ContactType(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static ContactType fromString(String val) {
        if (val == null) return null;
        for (ContactType ct : values()) {
            if (ct.value.equalsIgnoreCase(val.trim())) {
                return ct;
            }
        }
        throw new IllegalArgumentException("Invalid contact type: " + val + ". Allowed: recruiter, client, student");
    }
}
