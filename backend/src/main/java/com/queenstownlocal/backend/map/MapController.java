package com.queenstownlocal.backend.map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/map")
public class MapController {

	private final MapService mapService;

	public MapController(MapService mapService) {
		this.mapService = mapService;
	}

	@GetMapping("/markers")
	MarkersResponse getMarkers(@RequestParam double west, @RequestParam double south, @RequestParam double east,
			@RequestParam double north, @RequestParam(required = false) String filter) {
		return this.mapService.findMarkers(west, south, east, north, filter);
	}

}
