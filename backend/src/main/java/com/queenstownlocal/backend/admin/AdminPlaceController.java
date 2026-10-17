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

/** /admin/places (docs/06-api-specification.md, section 9). SecurityConfiguration lets only admins in. */
@RestController
@RequestMapping("/api/v1/admin/places")
public class AdminPlaceController {

	private final AdminPlaceService service;

	public AdminPlaceController(AdminPlaceService service) {
		this.service = service;
	}

	@GetMapping
	PageResponse<AdminPlace> list(@RequestParam(required = false) String q,
			@RequestParam(required = false) String status, @RequestParam(required = false) String category,
			@RequestParam(required = false) Integer page, @RequestParam(required = false) Integer size) {
		return this.service.list(q, status, category, page, size);
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	AdminPlace create(@Valid @RequestBody AdminPlaceRequest request) {
		return this.service.create(request);
	}

	@GetMapping("/{id}")
	AdminPlace get(@PathVariable long id) {
		return this.service.get(id);
	}

	@PutMapping("/{id}")
	AdminPlace update(@PathVariable long id, @Valid @RequestBody AdminPlaceRequest request) {
		return this.service.update(id, request);
	}

}
