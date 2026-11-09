package com.cinebook.payment.domain.enums;

public enum PaymentStatus {
    PENDING, PROCESSING, SUCCEEDED, FAILED,
    /** Đã thu tiền nhưng booking từ chối (hết hạn/huỷ/đã trả bằng payment khác) → đã hoàn tiền (mock). */
    REFUNDED;

    public boolean isTerminal() {
        return this == SUCCEEDED || this == FAILED || this == REFUNDED;
    }
}
