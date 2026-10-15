package com.queenstownlocal.backend.notice;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.queenstownlocal.backend.common.page.PageResponse;

@RestController
@RequestMapping("/api/v1/notices")
public class NoticeController {

	private final NoticeService noticeService;

	public NoticeController(NoticeService noticeService) {
		this.noticeService = noticeService;
	}

	@GetMapping
	PageResponse<NoticeSummary> getNotices(@RequestParam(required = false) String type,
			@RequestParam(required = false) Integer page, @RequestParam(required = false) Integer size) {
		return this.noticeService.findListedNotices(type, page, size);
	}

	@GetMapping("/{slug}")
	NoticeDetail getNotice(@PathVariable String slug) {
		return this.noticeService.getPublicNotice(slug);
	}

}
