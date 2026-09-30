package com.cinebook.payment.controller;

import com.cinebook.payment.controller.dto.CompletePaymentRequest;
import com.cinebook.payment.controller.dto.CreatePaymentRequest;
import com.cinebook.payment.controller.dto.PaymentResponse;
import com.cinebook.payment.service.PaymentCreateResult;
import com.cinebook.payment.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.UUID;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {
    private final PaymentService service;

    public PaymentController(PaymentService service) { this.service = service; }

    @PostMapping
    public ResponseEntity<PaymentResponse> create(@RequestHeader("X-User-Id") UUID userId,
                                                  @RequestHeader("Idempotency-Key") UUID requestId,
                                                  @Valid @RequestBody CreatePaymentRequest request) {
        PaymentCreateResult result = service.create(request, userId, requestId);
        if (!result.created()) return ResponseEntity.ok(result.response());
        return ResponseEntity.created(URI.create("/api/payments/" + result.response().id())).body(result.response());
    }

    @GetMapping("/me")
    public Page<PaymentResponse> mine(@RequestHeader("X-User-Id") UUID userId,
                                     @RequestParam(defaultValue = "0") int page,
                                     @RequestParam(defaultValue = "20") int pageSize) {
        int safeSize = Math.min(Math.max(pageSize, 1), 100);
        return service.findMine(userId, PageRequest.of(Math.max(page, 0), safeSize,
            Sort.by(Sort.Direction.DESC, "createdAt")));
    }

    @GetMapping("/{id}")
    public PaymentResponse get(@PathVariable UUID id, @RequestHeader("X-User-Id") UUID userId) {
        return service.get(id, userId);
    }

    @PostMapping("/{id}/complete")
    public PaymentResponse complete(@PathVariable UUID id, @RequestHeader("X-User-Id") UUID userId,
                                    @Valid @RequestBody CompletePaymentRequest request) {
        return service.complete(id, userId, request);
    }

    @PostMapping("/{id}/retry")
    public PaymentResponse retry(@PathVariable UUID id, @RequestHeader("X-User-Id") UUID userId) {
        return service.retry(id, userId);
    }
}
