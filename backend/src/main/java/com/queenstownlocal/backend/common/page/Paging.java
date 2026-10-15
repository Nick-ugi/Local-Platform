package com.queenstownlocal.backend.common.page;

import com.queenstownlocal.backend.common.error.ApiException;

/** Which part of a list a request asks for (docs/06-api-specification.md, section 1). */
public record Paging(int page, int size) {

	static final int DEFAULT_SIZE = 20;

	static final int MAX_SIZE = 50;

	/** Reads the {@code page} and {@code size} parameters. A missing one takes its default. */
	public static Paging of(Integer page, Integer size) {
		int pageNumber = page == null ? 1 : page;
		int pageSize = size == null ? DEFAULT_SIZE : size;
		if (pageNumber < 1) {
			throw ApiException.invalid("page", "must be 1 or greater");
		}
		if (pageSize < 1 || pageSize > MAX_SIZE) {
			throw ApiException.invalid("size", "must be between 1 and " + MAX_SIZE);
		}
		return new Paging(pageNumber, pageSize);
	}

	/** How many items come before this page. */
	public long offset() {
		return (long) (this.page - 1) * this.size;
	}

}
