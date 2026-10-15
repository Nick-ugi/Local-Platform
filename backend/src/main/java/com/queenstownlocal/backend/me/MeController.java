package com.queenstownlocal.backend.me;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.queenstownlocal.backend.auth.AuthService;
import com.queenstownlocal.backend.auth.TokenResponse;
import com.queenstownlocal.backend.security.AuthenticatedUser;

/** The signed-in account (docs/06-api-specification.md, section 8). */
@RestController
@RequestMapping("/api/v1/me")
public class MeController {

	private final AuthService authService;

	public MeController(AuthService authService) {
		this.authService = authService;
	}

	@GetMapping
	TokenResponse.User me(Authentication authentication) {
		return this.authService.me(AuthenticatedUser.of(authentication));
	}

}
