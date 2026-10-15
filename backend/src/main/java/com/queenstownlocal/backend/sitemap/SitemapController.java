package com.queenstownlocal.backend.sitemap;

import java.time.Clock;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * The detail pages the web app lists in sitemap.xml (SEO-02). Ended events and notices keep their
 * pages but are left out, as their pages ask search engines not to index them.
 */
@RestController
@RequestMapping("/api/v1/sitemap")
public class SitemapController {

	private final SitemapMapper sitemapMapper;

	private final Clock clock;

	public SitemapController(SitemapMapper sitemapMapper, Clock clock) {
		this.sitemapMapper = sitemapMapper;
		this.clock = clock;
	}

	@GetMapping
	SitemapResponse getSitemap() {
		OffsetDateTime now = this.clock.instant().atOffset(ZoneOffset.UTC);
		return new SitemapResponse(this.sitemapMapper.findPlaces(), this.sitemapMapper.findEvents(now),
				this.sitemapMapper.findNotices(now));
	}

}
