# The API as a container image. The same file is used by Render (render.yaml) and by the server
# stack in deploy/compose.yaml. Build from this folder: docker build -t queenstown-api backend

FROM eclipse-temurin:21-jdk AS build
WORKDIR /src
# The wrapper and the build files first, so the dependencies stay cached while only the code changes.
COPY gradlew settings.gradle build.gradle ./
COPY gradle gradle
RUN chmod +x gradlew && ./gradlew --no-daemon dependencies > /dev/null
COPY src src
RUN ./gradlew --no-daemon bootJar -x test \
	&& find build/libs -name '*.jar' ! -name '*-plain.jar' -exec cp {} /src/app.jar \;

FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app
COPY --from=build /src/app.jar app.jar
USER app
# The heap follows the container's memory (Render's free plan has 512 MB).
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75" \
	SPRING_PROFILES_ACTIVE=prod
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=90s --retries=3 \
	CMD wget -qO- "http://localhost:${PORT:-8080}/actuator/health" > /dev/null || exit 1
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
