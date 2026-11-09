package com.cinebook.payment.client;

import com.cinebook.payment.client.dto.BookingPaymentStatusDto;
import com.cinebook.payment.exception.BookingClientException;
import com.cinebook.payment.exception.BookingUnavailableException;
import com.cinebook.payment.exception.PaymentException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.ResourceAccessException;

import java.math.BigDecimal;
import java.util.UUID;

@Component
public class BookingServiceClient {
    private final RestClient restClient;

    public BookingServiceClient(RestClient bookingRestClient) {
        this.restClient = bookingRestClient;
    }

    public BookingPaymentStatusDto getPaymentStatus(UUID bookingId, UUID userId) {
        try {
            BookingPaymentStatusDto response = restClient.get()
                .uri(uri -> uri.path("/api/internal/bookings/{id}/payment-status").queryParam("userId", userId).build(bookingId))
                .retrieve().body(BookingPaymentStatusDto.class);
            if (response == null) throw new BookingUnavailableException("Booking trả về response rỗng");
            return response;
        } catch (RestClientResponseException ex) {
            throw map(ex);
        } catch (ResourceAccessException ex) {
            throw new BookingUnavailableException("Không thể kết nối booking-service");
        }
    }


    private PaymentException map(RestClientResponseException ex) {
        HttpStatus status = HttpStatus.resolve(ex.getStatusCode().value());
        if (status == null || status.is5xxServerError()) {
            return new BookingUnavailableException("Booking service trả về HTTP " + ex.getStatusCode().value());
        }
        if (status == HttpStatus.NOT_FOUND) return new BookingClientException("BOOKING_NOT_FOUND", "Không tìm thấy booking", status);
        if (status == HttpStatus.GONE) return new BookingClientException("BOOKING_EXPIRED", "Booking đã hết hạn", status);
        if (status == HttpStatus.UNPROCESSABLE_ENTITY) return new BookingClientException("BOOKING_PAYMENT_REJECTED", "Booking từ chối dữ liệu thanh toán", status);
        return new BookingClientException("BOOKING_REJECTED", "Booking từ chối xác nhận thanh toán", status);
    }
}
