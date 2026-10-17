package com.queenstownlocal.backend.auth;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

	private final AuthService authService;

	public AuthController(AuthService authService) {
		this.authService = authService;
	}

	@PostMapping("/signup")
	@ResponseStatus(HttpStatus.CREATED)
	TokenResponse signup(@Valid @RequestBody AuthRequests.Signup request) {
		return this.authService.signup(request);
	}

	@PostMapping("/login")
	TokenResponse login(@Valid @RequestBody AuthRequests.Login request) {
		return this.authService.login(request);
	}

	@PostMapping("/refresh")
	TokenResponse refresh(@Valid @RequestBody AuthRequests.Refresh request) {
		return this.authService.refresh(request.refreshToken());
	}

	@PostMapping("/logout")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void logout(@Valid @RequestBody AuthRequests.Refresh request) {
		this.authService.logout(request.refreshToken());
	}

}
