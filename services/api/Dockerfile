# Multi-stage Dockerfile for Spring Boot API (Supports linux/amd64 and linux/arm64)
# Stage 1: Build the application
FROM maven:3.9.9-eclipse-temurin-21 AS builder
WORKDIR /workspace

# Copy POM files and source code
COPY pom.xml /workspace/root-pom.xml
COPY services/api/pom.xml /workspace/services/api/pom.xml
COPY services/api/src /workspace/services/api/src
COPY content /workspace/content

WORKDIR /workspace/services/api
RUN mvn clean package -DskipTests

# Stage 2: Minimal runtime image
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

# Create unprivileged user
RUN groupadd -r spring && useradd -r -g spring spring

# Copy compiled JAR and content directory
COPY --from=builder /workspace/services/api/target/*.jar /app/app.jar
COPY --from=builder /workspace/content /app/content

# Ensure file ownership
RUN chown -R spring:spring /app
USER spring:spring

ENV JAVA_OPTS="-XX:InitialRAMPercentage=40.0 -XX:MaxRAMPercentage=75.0 -XX:+UseG1GC"
ENV SERVER_PORT=8080

EXPOSE 8080

HEALTHCHECK --interval=10s --timeout=3s --retries=5 --start-period=30s \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
