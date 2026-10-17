package com.queenstownlocal.backend.admin;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.queenstownlocal.backend.common.page.PageResponse;

import jakarta.validation.Valid;

/** /admin/events (docs/06-api-specification.md, section 9). SecurityConfiguration lets only admins in. */
@RestController
@RequestMapping("/api/v1/admin/events")
public class AdminEventController {

	private final AdminEventService service;

	public AdminEventController(AdminEventService service) {
		this.service = service;
	}

	@GetMapping
	PageResponse<AdminEvent> list(@RequestParam(required = false) String q,
			@RequestParam(required = false) String status, @RequestParam(required = false) Integer page,
			@RequestParam(required = false) Integer size) {
		return this.service.list(q, status, page, size);
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	AdminEvent create(@Valid @RequestBody AdminEventRequest request) {
		return this.service.create(request);
	}

	@GetMapping("/{id}")
	AdminEvent get(@PathVariable long id) {
		return this.service.get(id);
	}

	@PutMapping("/{id}")
	AdminEvent update(@PathVariable long id, @Valid @RequestBody AdminEventRequest request) {
		return this.service.update(id, request);
	}

}
