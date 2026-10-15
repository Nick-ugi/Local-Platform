package com.queenstownlocal.backend.place;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.queenstownlocal.backend.common.page.PageResponse;

@RestController
@RequestMapping("/api/v1/places")
public class PlaceController {

	private final PlaceService placeService;

	public PlaceController(PlaceService placeService) {
		this.placeService = placeService;
	}

	@GetMapping
	PageResponse<PlaceSummary> getPlaces(@RequestParam(required = false) String category,
			@RequestParam(required = false) String q, @RequestParam(required = false) Double lat,
			@RequestParam(required = false) Double lng, @RequestParam(required = false) Integer page,
			@RequestParam(required = false) Integer size) {
		return this.placeService.findPublicPlaces(category, q, lat, lng, page, size);
	}

	@GetMapping("/{slug}")
	PlaceDetail getPlace(@PathVariable String slug) {
		return this.placeService.getPublicPlace(slug);
	}

}
