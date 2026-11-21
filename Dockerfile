# ==========================================
# Stage 1: Build Frontend (React)
# ==========================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
ENV REACT_APP_API_URL=/api
RUN npm run build

# ==========================================
# Stage 2: Build Backend (Spring Boot)
# ==========================================
FROM maven:3.9.6-eclipse-temurin-21-alpine AS backend-builder
WORKDIR /app/backend

COPY backend/pom.xml ./
RUN mvn dependency:go-offline -B

COPY backend/src ./src

# Copy built frontend assets to Spring Boot static resources
COPY --from=frontend-builder /app/frontend/build ./src/main/resources/static/

RUN mvn clean package -DskipTests -B

# ==========================================
# Stage 3: Minimal Production Runtime
# ==========================================
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=backend-builder /app/backend/target/expense-tracker-1.0.0.jar app.jar

USER appuser

EXPOSE 8080

ENV PORT=8080 \
    JAVA_OPTS="-Xmx400m -Xms200m -XX:+UseG1GC"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
