package com.queenstownlocal.backend.auth;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Base64;
import java.util.HexFormat;

import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.queenstownlocal.backend.common.error.ApiException;
import com.queenstownlocal.backend.common.error.ErrorCode;
import com.queenstownlocal.backend.security.AuthenticatedUser;
import com.queenstownlocal.backend.security.JwtProperties;
import com.queenstownlocal.backend.security.JwtService;

/**
 * Accounts and their tokens (USER-01, USER-02). A refresh token is 32 random bytes; only its
 * SHA-256 hash is stored, and each one can be used once: refreshing revokes it and issues a new
 * pair.
 */
@Service
public class AuthService {

	private final UserMapper users;

	private final RefreshTokenMapper refreshTokens;

	private final PasswordEncoder passwords;

	private final JwtService jwt;

	private final JwtProperties properties;

	private final Clock clock;

	private final SecureRandom random = new SecureRandom();

	/** The hash a login with an unknown email is checked against, so both failures take as long. */
	private final String noAccountHash;

	public AuthService(UserMapper users, RefreshTokenMapper refreshTokens, PasswordEncoder passwords, JwtService jwt,
			JwtProperties properties, Clock clock) {
		this.users = users;
		this.refreshTokens = refreshTokens;
		this.passwords = passwords;
		this.jwt = jwt;
		this.properties = properties;
		this.clock = clock;
		this.noAccountHash = passwords.encode("no account has this password");
	}

	@Transactional
	public TokenResponse signup(AuthRequests.Signup request) {
		String email = request.email().strip();
		long id;
		try {
			id = this.users.insert(email, this.passwords.encode(request.password()));
		}
		catch (DuplicateKeyException ex) {
			throw new ApiException(ErrorCode.EMAIL_ALREADY_USED, "This email already has an account.");
		}
		return issue(new AuthenticatedUser(id, email, "user"));
	}

	/** One answer for a wrong password and an unknown email, so the API does not tell which emails exist. */
	@Transactional
	public TokenResponse login(AuthRequests.Login request) {
		UserAccount account = this.users.findByEmail(request.email().strip()).orElse(null);
		String hash = account == null ? this.noAccountHash : account.passwordHash();
		if (!this.passwords.matches(request.password(), hash) || account == null) {
			throw new ApiException(ErrorCode.INVALID_CREDENTIALS, "The email or password is wrong.");
		}
		return issue(new AuthenticatedUser(account.id(), account.email(), account.role()));
	}

	@Transactional
	public TokenResponse refresh(String refreshToken) {
		long userId = this.refreshTokens.revokeIfActive(hash(refreshToken), now())
			.orElseThrow(() -> new ApiException(ErrorCode.INVALID_REFRESH_TOKEN, "Sign in again."));
		UserAccount account = this.users.findById(userId)
			.orElseThrow(() -> new ApiException(ErrorCode.INVALID_REFRESH_TOKEN, "Sign in again."));
		return issue(new AuthenticatedUser(account.id(), account.email(), account.role()));
	}

	/** Revokes the token. One that is already unusable needs nothing more. */
	@Transactional
	public void logout(String refreshToken) {
		this.refreshTokens.revokeIfActive(hash(refreshToken), now());
	}

	public TokenResponse.User me(AuthenticatedUser user) {
		UserAccount account = this.users.findById(user.id())
			.orElseThrow(() -> new ApiException(ErrorCode.UNAUTHORIZED, "Sign in to continue."));
		return new TokenResponse.User(account.email(), account.role());
	}

	private TokenResponse issue(AuthenticatedUser user) {
		byte[] bytes = new byte[32];
		this.random.nextBytes(bytes);
		String refreshToken = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
		this.refreshTokens.insert(user.id(), hash(refreshToken), now().plus(this.properties.refreshTokenTtl()));
		return new TokenResponse(this.jwt.issue(user), refreshToken, this.jwt.accessTokenSeconds(),
				new TokenResponse.User(user.email(), user.role()));
	}

	private OffsetDateTime now() {
		return this.clock.instant().atOffset(ZoneOffset.UTC);
	}

	/** SHA-256 in hex: 64 characters, as refresh_token.token_hash holds. */
	static String hash(String token) {
		try {
			byte[] digest = MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8));
			return HexFormat.of().formatHex(digest);
		}
		catch (NoSuchAlgorithmException ex) {
			throw new IllegalStateException("SHA-256 is part of every Java runtime", ex);
		}
	}

}
