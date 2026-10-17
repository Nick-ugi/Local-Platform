package com.queenstownlocal.backend.auth;

/** A row of app_user. */
public record UserAccount(long id, String email, String passwordHash, String role) {
}
