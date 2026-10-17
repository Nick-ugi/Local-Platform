package com.queenstownlocal.backend.auth;

import java.util.Optional;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface UserMapper {

	/** Adds an account with the role user and returns its id. Fails on an email already used. */
	long insert(@Param("email") String email, @Param("passwordHash") String passwordHash);

	/** Finds an account by email, whatever its case. */
	Optional<UserAccount> findByEmail(String email);

	Optional<UserAccount> findById(long id);

}
