# Use Maven image to build
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# Copy pom.xml and download dependencies
COPY backend-java/pom.xml .
RUN mvn dependency:go-offline

# Copy source code and build
COPY backend-java/src ./src
RUN mvn clean package -DskipTests

# Use JRE for runtime
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copy jar from build stage
COPY --from=build /app/target/*.jar app.jar

# Expose port
EXPOSE 8080

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
