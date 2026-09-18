package com.cinebook.booking.security;

import java.util.UUID;

public interface CurrentUserProvider {
    UUID requiredUserId(String headerValue);
    UUID optionalUserId(String headerValue);
}
