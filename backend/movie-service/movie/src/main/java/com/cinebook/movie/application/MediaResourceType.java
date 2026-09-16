package com.cinebook.movie.application;

public enum MediaResourceType {
    IMAGE("image"),
    VIDEO("video");

    private final String cloudinaryValue;

    MediaResourceType(String cloudinaryValue) {
        this.cloudinaryValue = cloudinaryValue;
    }

    public String cloudinaryValue() {
        return cloudinaryValue;
    }
}
