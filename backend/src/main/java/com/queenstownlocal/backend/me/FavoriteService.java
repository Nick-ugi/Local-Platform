package com.queenstownlocal.backend.me;

import java.time.Clock;
import java.time.ZoneOffset;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.queenstownlocal.backend.common.error.ApiException;
import com.queenstownlocal.backend.common.error.ErrorCode;

/** The places an account has saved (FAV-01, FAV-02). Saving and removing can both be repeated. */
@Service
public class FavoriteService {

	private final FavoriteMapper favorites;

	private final Clock clock;

	public FavoriteService(FavoriteMapper favorites, Clock clock) {
		this.favorites = favorites;
		this.clock = clock;
	}

	public FavoritesResponse list(long userId) {
		return new FavoritesResponse(this.favorites.findPlaces(userId));
	}

	@Transactional
	public void save(long userId, String slug) {
		long placeId = this.favorites.findPublicPlaceId(slug)
			.orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Place not found."));
		this.favorites.insert(userId, placeId, this.clock.instant().atOffset(ZoneOffset.UTC));
	}

	@Transactional
	public void remove(long userId, String slug) {
		this.favorites.delete(userId, slug);
	}

}
