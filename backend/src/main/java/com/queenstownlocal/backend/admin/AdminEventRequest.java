package com.queenstownlocal.backend.admin;

import java.time.OffsetDateTime;

import com.queenstownlocal.backend.common.validation.HttpUrl;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * The body of POST and PUT /admin/events (docs/06-api-specification.md, section 9). Times carry
 * their offset, as the admin sends them in New Zealand time.
 */
public record AdminEventRequest(@NotBlank @Size(max = 160) String title, String description,
		@NotNull OffsetDateTime startsAt, OffsetDateTime endsAt, @NotBlank @Size(max = 120) String venueName,
		@Size(max = 255) String address, @NotNull @DecimalMin("-90") @DecimalMax("90") Double latitude,
		@NotNull @DecimalMin("-180") @DecimalMax("180") Double longitude, @HttpUrl String imageUrl,
		@NotBlank @Size(max = 120) String source, @NotBlank @HttpUrl String sourceUrl,
		@NotBlank @Pattern(regexp = "public|private") String status) {

	/** An end, when there is one, is not before the start (ck_event_period). */
	@AssertTrue(message = "must not be before startsAt")
	public boolean isEndsAt() {
		return this.endsAt == null || this.startsAt == null || !this.endsAt.isBefore(this.startsAt);
	}

}
