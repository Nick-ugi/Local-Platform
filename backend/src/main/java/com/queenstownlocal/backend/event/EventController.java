package com.queenstownlocal.backend.event;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.queenstownlocal.backend.common.page.PageResponse;

@RestController
@RequestMapping("/api/v1/events")
public class EventController {

	private final EventService eventService;

	public EventController(EventService eventService) {
		this.eventService = eventService;
	}

	@GetMapping
	PageResponse<EventSummary> getEvents(@RequestParam(required = false) String when,
			@RequestParam(required = false) Integer page, @RequestParam(required = false) Integer size) {
		return this.eventService.findListedEvents(when, page, size);
	}

	@GetMapping("/{slug}")
	EventDetail getEvent(@PathVariable String slug) {
		return this.eventService.getPublicEvent(slug);
	}

}
