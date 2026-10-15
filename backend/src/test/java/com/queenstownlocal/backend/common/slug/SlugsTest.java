package com.queenstownlocal.backend.common.slug;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

class SlugsTest {

	@Test
	void lowerCaseWordsJoinedByHyphens() {
		assertThat(Slugs.base("Lakeside Kitchen", "place", 120)).isEqualTo("lakeside-kitchen");
		assertThat(Slugs.base("  The Mall -- Taproom!  ", "place", 120)).isEqualTo("the-mall-taproom");
	}

	@Test
	void accentsAndMacronsBecomePlainLetters() {
		assertThat(Slugs.base("Café Ōtautahi & Co.", "place", 120)).isEqualTo("cafe-otautahi-co");
	}

	@Test
	void aNameWithoutLettersOrDigitsGetsTheFallback() {
		assertThat(Slugs.base("한글 カフェ", "place", 120)).isEqualTo("place");
		assertThat(Slugs.base("", "event", 160)).isEqualTo("event");
	}

	@Test
	void aLongNameIsCutWithRoomForANumberAndNoTrailingHyphen() {
		String slug = Slugs.base("a".repeat(110) + " bbbbbbbbbbbbbbb", "place", 120);

		assertThat(slug).hasSizeLessThanOrEqualTo(114).doesNotEndWith("-");
	}

	@Test
	void aTakenSlugGetsTheNextNumber() {
		assertThat(Slugs.unique("harbour-coffee", List.of())).isEqualTo("harbour-coffee");
		assertThat(Slugs.unique("harbour-coffee", List.of("harbour-coffee"))).isEqualTo("harbour-coffee-2");
		assertThat(Slugs.unique("harbour-coffee", List.of("harbour-coffee", "harbour-coffee-2", "harbour-coffee-4")))
			.isEqualTo("harbour-coffee-3");
	}

}
