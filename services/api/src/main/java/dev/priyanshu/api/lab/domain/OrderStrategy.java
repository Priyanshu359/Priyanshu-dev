package dev.priyanshu.api.lab.domain;

public enum OrderStrategy {
    NONE("none", "lab.orders_noidx"),
    SINGLE("single", "lab.orders_user_idx"),
    COMPOSITE("composite", "lab.orders_composite_idx");

    private final String id;
    private final String tableName;

    OrderStrategy(String id, String tableName) {
        this.id = id;
        this.tableName = tableName;
    }

    public String getId() {
        return id;
    }

    public String getTableName() {
        return tableName;
    }

    public static OrderStrategy fromString(String val) {
        if (val == null) return NONE;
        for (OrderStrategy s : values()) {
            if (s.id.equalsIgnoreCase(val.trim())) {
                return s;
            }
        }
        return NONE;
    }
}
