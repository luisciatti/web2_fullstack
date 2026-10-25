FROM --platform=$BUILDPLATFORM node:22 AS front
WORKDIR /front
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# --- build ---
FROM --platform=$BUILDPLATFORM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /workspace
COPY backend/pom.xml ./backend/pom.xml
WORKDIR /workspace/backend
RUN mvn -B -q dependency:go-offline
COPY backend/src ./src
COPY --from=front /front/dist ./src/main/resources/static
RUN mvn -B -q -DskipTests package

# --- run ---
FROM eclipse-temurin:21-jre
WORKDIR /app
RUN useradd --system --uid 10001 app
COPY --from=build /workspace/backend/target/*.jar app.jar
USER app
EXPOSE 8080
ENV SPRING_PROFILES_ACTIVE=prod
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]
