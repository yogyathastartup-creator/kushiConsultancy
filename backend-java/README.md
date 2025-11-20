# Kushi Consultancy Backend

Spring Boot REST API backend for Kushi Consultancy website.

## Features

- **Authentication**: JWT-based authentication with access/refresh tokens
- **File Upload**: CV upload with validation and storage
- **Email Notifications**: Gmail SMTP integration for notifications
- **Health Check**: API health monitoring endpoint

## Technology Stack

- **Java**: 21 LTS
- **Spring Boot**: 3.3.5
- **Build Tool**: Maven
- **Email**: JavaMail with Gmail SMTP

## Project Structure

```
backend-java/
├── src/
│   ├── main/
│   │   ├── java/com/kushi/consultancy/
│   │   │   ├── KushiConsultancyApplication.java
│   │   │   ├── config/
│   │   │   │   └── WebConfig.java
│   │   │   ├── controller/
│   │   │   │   ├── AuthController.java
│   │   │   │   ├── EmailController.java
│   │   │   │   ├── HealthController.java
│   │   │   │   └── UploadController.java
│   │   │   ├── security/
│   │   │   │   └── JwtUtil.java
│   │   │   └── service/
│   │   │       ├── EmailService.java
│   │   │       └── FileStorageService.java
│   │   └── resources/
│   │       └── application.properties
│   └── test/
│       └── java/com/kushi/consultancy/
├── pom.xml
└── README.md
```

## Prerequisites

- Java 21 or higher
- Maven 3.6+
- Gmail account with App Password (for email functionality)

## Configuration

### Environment Variables

Set the following environment variables:

```bash
MAIL_USERNAME=your-email@gmail.com
MAIL_APP_PASSWORD=your-16-char-app-password
MAIL_RECIPIENT=recipient@email.com
```

### Gmail Setup

1. Enable 2-factor authentication in your Google account
2. Go to Google Account > Security > 2-Step Verification > App passwords
3. Generate an app password for "Mail"
4. Use the generated 16-character password in `MAIL_APP_PASSWORD`

## Build & Run

### Build the project

```bash
mvn clean package
```

### Run the application

```bash
java -jar target/consultancy-backend-1.0.0.jar
```

Or run directly with Maven:

```bash
mvn spring-boot:run
```

The server will start on `http://localhost:3002`

## API Endpoints

### Health Check
- `GET /api/health` - Check if server is running

### Authentication
- `POST /api/auth/login` - Login with username/password
- `POST /api/auth/logout` - Logout and clear tokens
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/verify` - Verify authentication status

### File Upload
- `POST /api/upload/cv` - Upload CV with applicant details

### Email
- `GET /api/email/status` - Check email configuration status
- `POST /api/email/test?recipient=email@example.com` - Send test email

## Default Admin Credentials

```
Username: admin
Password: changeme
```

**⚠️ Change these in production via `application.properties`**

## Configuration Properties

Key configuration in `src/main/resources/application.properties`:

- `server.port` - Server port (default: 3002)
- `app.cors.origins` - Allowed CORS origins
- `app.auth.admin.username` - Admin username
- `app.auth.admin.password` - Admin password
- `app.jwt.access-secret` - JWT access token secret (Base64)
- `app.jwt.refresh-secret` - JWT refresh token secret (Base64)
- `spring.mail.*` - Gmail SMTP configuration

## Development

### Running Tests

```bash
mvn test
```

### Clean Build

```bash
mvn clean package
```

## License

Proprietary - Kushi Consultancy
