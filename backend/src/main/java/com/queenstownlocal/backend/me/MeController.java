package com.queenstownlocal.backend.me;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.queenstownlocal.backend.auth.AuthRateLimiter;
import com.queenstownlocal.backend.auth.AuthRequests;
import com.queenstownlocal.backend.auth.AuthService;
import com.queenstownlocal.backend.auth.TokenResponse;
import com.queenstownlocal.backend.security.AuthenticatedUser;

/** The signed-in account and its favorites (docs/06-api-specification.md, section 8). */
@RestController
@RequestMapping("/api/v1/me")
public class MeController {

	private final AuthService authService;

	private final FavoriteService favoriteService;

	private final AuthRateLimiter rateLimiter;

	public MeController(AuthService authService, FavoriteService favoriteService, AuthRateLimiter rateLimiter) {
		this.authService = authService;
		this.favoriteService = favoriteService;
		this.rateLimiter = rateLimiter;
	}

	@GetMapping
	TokenResponse.User me(Authentication authentication) {
		return this.authService.me(AuthenticatedUser.of(authentication));
	}

	/** Deletes the signed-in account, with the password again; tries are limited as log in's are. */
	@DeleteMapping
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void delete(Authentication authentication, @Valid @RequestBody AuthRequests.DeleteAccount request,
			HttpServletRequest http) {
		AuthenticatedUser user = AuthenticatedUser.of(authentication);
		this.rateLimiter.acquire(http.getRemoteAddr(), "delete:" + user.id());
		this.authService.deleteAccount(user, request.password());
	}

	@GetMapping("/favorites")
	FavoritesResponse favorites(Authentication authentication) {
		return this.favoriteService.list(accountId(authentication));
	}

	@PutMapping("/favorites/{slug}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void save(Authentication authentication, @PathVariable String slug) {
		this.favoriteService.save(accountId(authentication), slug);
	}

	@DeleteMapping("/favorites/{slug}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void remove(Authentication authentication, @PathVariable String slug) {
		this.favoriteService.remove(accountId(authentication), slug);
	}

	/** The id of the account the token names, which must still exist (it may have been deleted). */
	private long accountId(Authentication authentication) {
		return this.authService.account(AuthenticatedUser.of(authentication)).id();
	}

}
