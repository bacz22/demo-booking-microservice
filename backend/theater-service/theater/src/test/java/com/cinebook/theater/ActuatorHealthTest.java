package com.cinebook.theater;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.health.actuate.endpoint.HealthDescriptor;
import org.springframework.boot.health.actuate.endpoint.HealthEndpoint;
import org.springframework.boot.health.contributor.Status;
import org.springframework.boot.test.context.SpringBootTest;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class ActuatorHealthTest {

    @Autowired
    private HealthEndpoint healthEndpoint;

    @Test
    @DisplayName("Kiểm tra Spring Boot Actuator HealthEndpoint báo cáo trạng thái UP cho toàn bộ subsystem")
    void testActuatorHealthReportsUp() {
        HealthDescriptor health = healthEndpoint.health();
        assertThat(health).isNotNull();
        assertThat(health.getStatus()).isEqualTo(Status.UP);
    }
}
