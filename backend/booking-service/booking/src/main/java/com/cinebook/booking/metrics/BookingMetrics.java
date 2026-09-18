package com.cinebook.booking.metrics;

import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.stereotype.Component;

@Component
public class BookingMetrics {
    private final MeterRegistry registry;
    public BookingMetrics(MeterRegistry registry) { this.registry = registry; }
    public void increment(String name) { registry.counter(name).increment(); }
}
