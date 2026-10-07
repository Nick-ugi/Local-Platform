package com.queenstownlocal.backend.place;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/places")
public class PlaceController {

	private final PlaceService placeService;

	public PlaceController(PlaceService placeService) {
		this.placeService = placeService;
	}

	@GetMapping("/{slug}")
	PlaceDetail getPlace(@PathVariable String slug) {
		return this.placeService.getPublicPlace(slug);
	}

}
