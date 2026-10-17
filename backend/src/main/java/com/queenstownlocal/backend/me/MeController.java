package com.queenstownlocal.backend.me;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.queenstownlocal.backend.auth.AuthService;
import com.queenstownlocal.backend.auth.TokenResponse;
import com.queenstownlocal.backend.security.AuthenticatedUser;

/** The signed-in account and its favorites (docs/06-api-specification.md, section 8). */
@RestController
@RequestMapping("/api/v1/me")
public class MeController {

	private final AuthService authService;

	private final FavoriteService favoriteService;

	public MeController(AuthService authService, FavoriteService favoriteService) {
		this.authService = authService;
		this.favoriteService = favoriteService;
	}

	@GetMapping
	TokenResponse.User me(Authentication authentication) {
		return this.authService.me(AuthenticatedUser.of(authentication));
	}

	@GetMapping("/favorites")
	FavoritesResponse favorites(Authentication authentication) {
		return this.favoriteService.list(AuthenticatedUser.of(authentication).id());
	}

	@PutMapping("/favorites/{slug}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void save(Authentication authentication, @PathVariable String slug) {
		this.favoriteService.save(AuthenticatedUser.of(authentication).id(), slug);
	}

	@DeleteMapping("/favorites/{slug}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void remove(Authentication authentication, @PathVariable String slug) {
		this.favoriteService.remove(AuthenticatedUser.of(authentication).id(), slug);
	}

}
