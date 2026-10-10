package com.queenstownlocal.backend.common.error;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

import org.springframework.boot.test.context.TestComponent;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoints that fail in each way the error handler has to cover. {@code @TestComponent} keeps it
 * out of the component scan of other tests; ErrorResponseTest imports it explicitly.
 */
@TestComponent
@RestController
class ErrorProbeController {

	record Body(@NotBlank String name) {
	}

	@GetMapping("/probe/not-found")
	void notFound() {
		throw new ApiException(ErrorCode.NOT_FOUND, "Place not found.");
	}

	@GetMapping("/probe/invalid")
	void invalid() {
		throw ApiException.invalid("west", "must be less than east");
	}

	@PostMapping("/probe/validate")
	void validate(@Valid @RequestBody Body body) {
	}

	@GetMapping("/probe/param")
	void param(@RequestParam int size) {
	}

	@GetMapping("/probe/boom")
	void boom() {
		throw new IllegalStateException("db password is hunter2");
	}

}
