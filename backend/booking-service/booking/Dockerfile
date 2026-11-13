# syntax=docker/dockerfile:1
# Build nhiều tầng: tầng 1 build jar bằng Maven (cache ~/.m2 giữa các lần build), tầng 2 chỉ chứa JRE + jar.

FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /src
COPY pom.xml .
RUN --mount=type=cache,target=/root/.m2 mvn -q -B dependency:go-offline -DskipTests || true
COPY src ./src
RUN --mount=type=cache,target=/root/.m2 mvn -q -B -DskipTests package     && cp "$(ls target/*.jar | grep -v '\.original$' | head -1)" /app.jar

FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app
COPY --from=build /app.jar app.jar
USER app
# Heap theo giới hạn bộ nhớ của container (mem_limit trong compose); SerialGC tốn ít RAM nhất cho service nhỏ.
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=70 -XX:+UseSerialGC -Xss512k -XX:TieredStopAtLevel=1"
EXPOSE 8083
HEALTHCHECK --interval=10s --timeout=3s --start-period=60s --retries=12   CMD wget -qO- http://localhost:8083/actuator/health | grep -q '"status":"UP"' || exit 1
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
