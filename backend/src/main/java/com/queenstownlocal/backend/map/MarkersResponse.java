package com.queenstownlocal.backend.map;

import java.util.List;

/** Response of GET /map/markers. {@code truncated} is true when the area holds more markers than were sent. */
public record MarkersResponse(List<PlaceMarker> markers, boolean truncated) {
}
