package com.queenstownlocal.backend.sitemap;

import java.util.List;

/** Response of GET /sitemap (docs/06-api-specification.md, section 7). */
public record SitemapResponse(List<SitemapEntry> places, List<SitemapEntry> events, List<SitemapEntry> notices) {
}
