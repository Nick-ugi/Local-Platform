package com.queenstownlocal.backend.admin;

import java.time.Clock;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.queenstownlocal.backend.common.error.ApiException;
import com.queenstownlocal.backend.common.error.ErrorCode;
import com.queenstownlocal.backend.common.page.PageResponse;
import com.queenstownlocal.backend.common.page.Paging;
import com.queenstownlocal.backend.common.slug.Slugs;
import com.queenstownlocal.backend.place.PlaceCategory;

/** Places for the admin (ADMIN-02): every status, created and changed, never deleted. */
@Service
public class AdminPlaceService {

	/** place.slug is varchar(120). */
	private static final int SLUG_LENGTH = 120;

	private final AdminPlaceMapper places;

	private final Clock clock;

	public AdminPlaceService(AdminPlaceMapper places, Clock clock) {
		this.places = places;
		this.clock = clock;
	}

	public PageResponse<AdminPlace> list(String q, String status, String category, Integer page, Integer size) {
		String pattern = AdminQuery.pattern(q);
		String statusCode = AdminQuery.code("status", status, AdminQuery.STATUSES);
		String categoryCode = AdminQuery.code("category", category, PlaceCategory.CODES);
		Paging paging = Paging.of(page, size);
		long total = this.places.count(pattern, statusCode, categoryCode);
		return new PageResponse<>(
				this.places.find(pattern, statusCode, categoryCode, paging.size(), paging.offset()), paging.page(),
				paging.size(), total);
	}

	public AdminPlace get(long id) {
		return this.places.findById(id).orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Place not found."));
	}

	/**
	 * Adds the place with a slug made from its name. Should another request take the same slug in
	 * the meantime, the database refuses it and the next free one is tried.
	 */
	@Transactional
	public AdminPlace create(AdminPlaceRequest request) {
		AdminPlaceRequest place = clean(request);
		String base = Slugs.base(place.name(), "place", SLUG_LENGTH);
		for (int attempt = 1;; attempt++) {
			String slug = Slugs.unique(base, this.places.findSlugs(base));
			try {
				return get(this.places.insert(slug, place, now()));
			}
			catch (DuplicateKeyException ex) {
				if (attempt == 3) {
					throw ex;
				}
			}
		}
	}

	@Transactional
	public AdminPlace update(long id, AdminPlaceRequest request) {
		if (this.places.update(id, clean(request), now()) == 0) {
			throw new ApiException(ErrorCode.NOT_FOUND, "Place not found.");
		}
		return get(id);
	}

	private static AdminPlaceRequest clean(AdminPlaceRequest r) {
		return new AdminPlaceRequest(Text.clean(r.name()), r.category(), Text.clean(r.subtype()),
				Text.clean(r.description()), Text.clean(r.address()), r.latitude(), r.longitude(),
				Text.clean(r.openingHours()), Text.clean(r.phone()), Text.clean(r.website()), Text.clean(r.imageUrl()),
				Text.clean(r.source()), Text.clean(r.sourceUrl()), r.status());
	}

	private OffsetDateTime now() {
		return this.clock.instant().atOffset(ZoneOffset.UTC);
	}

}
