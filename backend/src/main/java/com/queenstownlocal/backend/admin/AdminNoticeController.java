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

/** /admin/notices (docs/06-api-specification.md, section 9). SecurityConfiguration lets only admins in. */
@RestController
@RequestMapping("/api/v1/admin/notices")
public class AdminNoticeController {

	private final AdminNoticeService service;

	public AdminNoticeController(AdminNoticeService service) {
		this.service = service;
	}

	@GetMapping
	PageResponse<AdminNotice> list(@RequestParam(required = false) String q,
			@RequestParam(required = false) String status, @RequestParam(required = false) String type, @RequestParam(required = false) Integer page,
			@RequestParam(required = false) Integer size) {
		return this.service.list(q, status, type, page, size);
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	AdminNotice create(@Valid @RequestBody AdminNoticeRequest request) {
		return this.service.create(request);
	}

	@GetMapping("/{id}")
	AdminNotice get(@PathVariable long id) {
		return this.service.get(id);
	}

	@PutMapping("/{id}")
	AdminNotice update(@PathVariable long id, @Valid @RequestBody AdminNoticeRequest request) {
		return this.service.update(id, request);
	}

}
