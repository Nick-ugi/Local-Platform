package com.queenstownlocal.backend.me;

import java.util.List;

import com.queenstownlocal.backend.place.PlaceSummary;

/** GET /me/favorites: a list with only {@code items} (docs/06-api-specification.md, section 8). */
public record FavoritesResponse(List<PlaceSummary> items) {
}
