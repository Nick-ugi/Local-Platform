package com.queenstownlocal.backend.auth;

import java.time.OffsetDateTime;
import java.util.Optional;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface RefreshTokenMapper {

	void insert(@Param("userId") long userId, @Param("tokenHash") String tokenHash,
			@Param("expiresAt") OffsetDateTime expiresAt);

	/**
	 * Revokes a token that is still good at {@code now} and returns its account, or nothing for a
	 * token that is unknown, revoked or expired. One statement, so two requests with the same token
	 * cannot both use it.
	 */
	Optional<Long> revokeIfActive(@Param("tokenHash") String tokenHash, @Param("now") OffsetDateTime now);

}
