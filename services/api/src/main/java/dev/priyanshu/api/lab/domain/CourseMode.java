package dev.priyanshu.api.lab.domain;

public enum CourseMode {
    NAIVE("naive"),
    FETCH("fetch");

    private final String id;

    CourseMode(String id) {
        this.id = id;
    }

    public String getId() {
        return id;
    }

    public static CourseMode fromString(String val) {
        if (val != null && val.equalsIgnoreCase("fetch")) {
            return FETCH;
        }
        return NAIVE;
    }
}
