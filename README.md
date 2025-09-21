# NestJS MongoDB API

A basic NestJS application with MongoDB integration.

## Prerequisites

- Node.js (v16 or higher)
- MongoDB running locally or accessible via connection string
- npm or yarn package manager

## Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment configuration:
```bash
cp env.example .env
```

3. Update `.env` file with your MongoDB connection string:
```
MONGODB_URI=mongodb://localhost:27017/nestjs-api
PORT=3000
NODE_ENV=development
```

## Running the application

### Development mode
```bash
npm run start:dev
```

### Production mode
```bash
npm run build
npm run start:prod
```

## API Endpoints

- `GET /` - Hello World message
- `GET /health` - Health check endpoint

## Project Structure

```
src/
├── app.controller.ts      # Main application controller
├── app.service.ts         # Main application service
├── app.module.ts          # Root application module
├── main.ts               # Application entry point
└── database/
    └── database.module.ts # Database configuration module
```

## Database

This application uses MongoDB with Mongoose ODM. The database connection is configured in the `DatabaseModule` and can be easily extended for additional collections and schemas.
