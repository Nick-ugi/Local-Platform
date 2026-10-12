package com.queenstownlocal.backend.common.page;

import java.util.List;

/** The body of every list response (docs/06-api-specification.md, section 1). Pages count from 1. */
public record PageResponse<T>(List<T> items, int page, int size, long total) {
}
