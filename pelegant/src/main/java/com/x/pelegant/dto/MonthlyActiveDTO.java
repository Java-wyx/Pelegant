package com.x.pelegant.dto;

public class MonthlyActiveDTO {
    private String name;
    private long value;

    public MonthlyActiveDTO() {}

    public MonthlyActiveDTO(String name, long value) {
        this.name = name;
        this.value = value;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public long getValue() { return value; }
    public void setValue(long value) { this.value = value; }
}
