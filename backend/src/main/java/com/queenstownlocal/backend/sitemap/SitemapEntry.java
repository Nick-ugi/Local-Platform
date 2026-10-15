package com.queenstownlocal.backend.sitemap;

import java.time.Instant;

/** A detail page for search engines: its slug and when its content last changed. */
public record SitemapEntry(String slug, Instant updatedAt) {
}
