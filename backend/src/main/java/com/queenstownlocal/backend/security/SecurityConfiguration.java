package com.queenstownlocal.backend.security;

import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Duration;
import java.util.List;
import java.util.Locale;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtTimestampValidator;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.firewall.RequestRejectedHandler;
import org.springframework.web.servlet.HandlerExceptionResolver;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import com.queenstownlocal.backend.common.error.ApiException;
import com.queenstownlocal.backend.common.error.ErrorCode;

/**
 * Who may call what (docs/06-api-specification.md, section 1): the public API is open, /me needs
 * a signed-in account and /admin an account whose role is admin. Requests carry an access token
 * as {@code Authorization: Bearer}; the API keeps no session and sets no cookie, so it needs no
 * CSRF protection.
 *
 * A missing or bad token and a missing role are answered by GlobalExceptionHandler, so they have
 * the same Problem Details body as every other error.
 */
@Configuration(proxyBeanMethods = false)
@EnableConfigurationProperties(JwtProperties.class)
public class SecurityConfiguration {

	private static final Logger log = LoggerFactory.getLogger(SecurityConfiguration.class);

	@Bean
	SecurityFilterChain apiSecurity(HttpSecurity http,
			@Qualifier("handlerExceptionResolver") HandlerExceptionResolver errors) throws Exception {
		http.csrf((csrf) -> csrf.disable())
			.sessionManagement((session) -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
			.httpBasic((basic) -> basic.disable())
			.formLogin((form) -> form.disable())
			.logout((logout) -> logout.disable())
			.requestCache((cache) -> cache.disable())
			.authorizeHttpRequests((requests) -> requests.requestMatchers("/api/v1/me", "/api/v1/me/**")
				.authenticated()
				.requestMatchers("/api/v1/admin", "/api/v1/admin/**")
				.hasRole("ADMIN")
				.anyRequest()
				.permitAll())
			.oauth2ResourceServer((server) -> server
				.jwt((jwt) -> jwt.jwtAuthenticationConverter(SecurityConfiguration::authentication))
				.authenticationEntryPoint((request, response, ex) -> errors.resolveException(request, response, null,
						new ApiException(ErrorCode.UNAUTHORIZED, "Sign in to continue.")))
				.accessDeniedHandler((request, response, ex) -> errors.resolveException(request, response, null,
						new ApiException(ErrorCode.FORBIDDEN, "You do not have access to this."))))
			.exceptionHandling((handling) -> handling
				.authenticationEntryPoint((request, response, ex) -> errors.resolveException(request, response, null,
						new ApiException(ErrorCode.UNAUTHORIZED, "Sign in to continue.")))
				.accessDeniedHandler((request, response, ex) -> errors.resolveException(request, response, null,
						new ApiException(ErrorCode.FORBIDDEN, "You do not have access to this."))))
			.anonymous(Customizer.withDefaults());
		return http.build();
	}

	/** The account in a verified token, with ROLE_USER or ROLE_ADMIN from its role. */
	static AbstractAuthenticationToken authentication(Jwt jwt) {
		String role = jwt.getClaimAsString(JwtService.ROLE);
		AuthenticatedUser user = new AuthenticatedUser(Long.parseLong(jwt.getSubject()),
				jwt.getClaimAsString(JwtService.EMAIL), role);
		JwtAuthenticationToken token = new JwtAuthenticationToken(jwt,
				List.of(new SimpleGrantedAuthority("ROLE_" + role.toUpperCase(Locale.ROOT))), jwt.getSubject());
		token.setDetails(user);
		return token;
	}

	/**
	 * Spring Security's firewall refuses some addresses outright, such as a path with an escaped
	 * semicolon. Such an address cannot name anything, so it is answered as not found, in the API's
	 * format.
	 */
	@Bean
	RequestRejectedHandler requestRejectedHandler(
			@Qualifier("handlerExceptionResolver") HandlerExceptionResolver errors) {
		return (request, response, ex) -> errors.resolveException(request, response, null,
				new ApiException(ErrorCode.NOT_FOUND, "Not found."));
	}

	@Bean
	SecretKey jwtKey(JwtProperties properties) {
		if (JwtProperties.DEVELOPMENT_SECRET.equals(properties.secret())) {
			log.warn("JWT_SECRET is not set: access tokens are signed with the development key.");
		}
		return new SecretKeySpec(properties.secret().getBytes(StandardCharsets.UTF_8), "HmacSHA256");
	}

	@Bean
	JwtEncoder jwtEncoder(SecretKey jwtKey) {
		return new NimbusJwtEncoder(new ImmutableSecret<>(jwtKey));
	}

	/** Checks the signature and the expiry, by the application's clock so tests can move time. */
	@Bean
	JwtDecoder jwtDecoder(SecretKey jwtKey, Clock clock) {
		NimbusJwtDecoder decoder = NimbusJwtDecoder.withSecretKey(jwtKey).macAlgorithm(MacAlgorithm.HS256).build();
		JwtTimestampValidator timestamps = new JwtTimestampValidator(Duration.ZERO);
		timestamps.setClock(clock);
		decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(List.of(timestamps)));
		return decoder;
	}

	@Bean
	PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}

}
