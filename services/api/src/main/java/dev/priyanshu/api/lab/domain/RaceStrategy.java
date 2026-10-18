package dev.priyanshu.api.lab.domain;

public enum RaceStrategy {
    NAIVE("naive"),
    LOCK("lock"),
    OPTIMISTIC("optimistic");

    private final String id;

    RaceStrategy(String id) {
        this.id = id;
    }

    public String getId() {
        return id;
    }

    public static RaceStrategy fromString(String val) {
        if (val == null) return NAIVE;
        for (RaceStrategy s : values()) {
            if (s.id.equalsIgnoreCase(val.trim())) {
                return s;
            }
        }
        return NAIVE;
    }
}
