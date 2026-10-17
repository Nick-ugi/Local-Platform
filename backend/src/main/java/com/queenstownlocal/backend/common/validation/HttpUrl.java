package com.queenstownlocal.backend.common.validation;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import java.net.URI;
import java.net.URISyntaxException;

import jakarta.validation.Constraint;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import jakarta.validation.Payload;

/**
 * An absolute http or https address of at most 500 characters, which is what the clients link to
 * (they open nothing else). Null and blank are valid, as an empty optional field; add @NotBlank where
 * the value is required.
 */
@Documented
@Constraint(validatedBy = HttpUrl.Validator.class)
@Target({ ElementType.FIELD, ElementType.PARAMETER, ElementType.RECORD_COMPONENT })
@Retention(RetentionPolicy.RUNTIME)
public @interface HttpUrl {

	String message() default "must be an http or https address";

	Class<?>[] groups() default {};

	Class<? extends Payload>[] payload() default {};

	class Validator implements ConstraintValidator<HttpUrl, String> {

		static final int MAX_LENGTH = 500;

		@Override
		public boolean isValid(String value, ConstraintValidatorContext context) {
			if (value == null || value.isBlank()) {
				return true;
			}
			if (value.strip().length() > MAX_LENGTH) {
				return false;
			}
			try {
				URI uri = new URI(value.strip());
				String scheme = uri.getScheme();
				return ("http".equalsIgnoreCase(scheme) || "https".equalsIgnoreCase(scheme)) && uri.getHost() != null;
			}
			catch (URISyntaxException ex) {
				return false;
			}
		}

	}

}
