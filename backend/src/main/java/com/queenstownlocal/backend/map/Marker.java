package com.queenstownlocal.backend.map;

/**
 * A marker of GET /map/markers. Every kind has these fields; each record adds the ones its summary
 * card needs (docs/06-api-specification.md, section 3).
 */
public sealed interface Marker permits PlaceMarker, EventMarker, NoticeMarker {

	String kind();

	String slug();

	double latitude();

	double longitude();

}
