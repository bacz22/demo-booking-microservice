package com.cinebook.payment.controller.dto;

import org.springframework.data.domain.Page;

import java.util.List;

/** Trang kết quả cho API admin (cùng dạng items/total với các service khác). */
public record AdminPage<T>(List<T> items, int page, int pageSize, long total, int totalPages) {
    public static <T> AdminPage<T> of(List<T> items, Page<?> page) {
        return new AdminPage<>(items, page.getNumber(), page.getSize(), page.getTotalElements(), page.getTotalPages());
    }
}
