package com.queenstownlocal.backend.admin;

import com.queenstownlocal.backend.common.validation.HttpUrl;
import com.queenstownlocal.backend.place.FacilitySubtype;
import com.queenstownlocal.backend.place.PlaceCategory;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * The body of POST and PUT /admin/places: every field, as docs/06-api-specification.md section 9
 * lists them. Rules that look at two fields are the {@code is...} checks below, reported under the
 * field they are about. Jackson builds the record from its components and never reads these, so
 * they need no @JsonIgnore (which would hide the field itself).
 */
public record AdminPlaceRequest(@NotBlank @Size(max = 120) String name, @NotBlank String category, String subtype,
		String description, @NotBlank @Size(max = 255) String address,
		@NotNull @DecimalMin("-90") @DecimalMax("90") Double latitude,
		@NotNull @DecimalMin("-180") @DecimalMax("180") Double longitude, @Size(max = 255) String openingHours,
		@Size(max = 30) String phone, @HttpUrl String website, @HttpUrl String imageUrl,
		@NotBlank @Size(max = 120) String source, @NotBlank @HttpUrl String sourceUrl,
		@NotBlank @Pattern(regexp = "public|private") String status) {

	@AssertTrue(message = "has an unknown value")
	public boolean isCategory() {
		return this.category == null || this.category.isBlank() || PlaceCategory.CODES.contains(this.category);
	}

	/** A facility names its kind; nothing else has one. */
	@AssertTrue(message = "is required for a facility, one of its codes, and empty for anything else")
	public boolean isSubtype() {
		boolean empty = this.subtype == null || this.subtype.isBlank();
		if ("facility".equals(this.category)) {
			return !empty && FacilitySubtype.CODES.contains(this.subtype);
		}
		return empty;
	}

}
