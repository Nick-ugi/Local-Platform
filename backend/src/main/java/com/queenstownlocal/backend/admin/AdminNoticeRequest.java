package com.queenstownlocal.backend.admin;

import java.time.OffsetDateTime;

import com.queenstownlocal.backend.common.validation.HttpUrl;
import com.queenstownlocal.backend.notice.NoticeType;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * The body of POST and PUT /admin/notices (docs/06-api-specification.md, section 9). A notice may
 * have no location: then latitude and longitude are both null.
 */
public record AdminNoticeRequest(@NotBlank @Size(max = 160) String title, @NotBlank String type,
		@NotBlank String summary, @NotNull OffsetDateTime startsAt, OffsetDateTime endsAt,
		@Size(max = 255) String locationName, @DecimalMin("-90") @DecimalMax("90") Double latitude,
		@DecimalMin("-180") @DecimalMax("180") Double longitude, @NotBlank @Size(max = 120) String sourceOrg,
		@NotBlank @HttpUrl String sourceUrl, @NotNull Boolean isOfficial,
		@NotBlank @Pattern(regexp = "public|private") String status) {

	@AssertTrue(message = "has an unknown value")
	public boolean isType() {
		return this.type == null || this.type.isBlank() || NoticeType.CODES.contains(this.type);
	}

	/** An end, when there is one, is not before the start (ck_notice_period). */
	@AssertTrue(message = "must not be before startsAt")
	public boolean isEndsAt() {
		return this.endsAt == null || this.startsAt == null || !this.endsAt.isBefore(this.startsAt);
	}

	/** A position is both coordinates or neither. */
	@AssertTrue(message = "must be given with longitude, or both left empty")
	public boolean isLatitude() {
		return (this.latitude == null) == (this.longitude == null);
	}

}
