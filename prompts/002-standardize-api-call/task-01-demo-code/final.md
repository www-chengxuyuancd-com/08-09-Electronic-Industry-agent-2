# Standardizing Front-End and Back-End Communication

## Architecture Overview

### Backend Layer

- **API Routes**: Implemented in `@/app/api/` following RESTful design principles
- **Error Handling**: Centralized error wrapper to standardize error responses
- **Response Structure**: Consistent format for success and error responses

### Frontend Layer

- **API Client Core**: Base utility in `@/lib/api-client.ts` for handling HTTP requests
- **API Client Modules**: Specific API clients in `@/api-clients/` folder
- **Client Components**: Use API clients to interact with backend
- **Error Handling**: Standardized error handling with Sonner toast notifications

## Core Components Design

### Backend Components

#### Error Wrapper

- Provides standardized error response structure
- Categorizes errors (client/server)
- Includes appropriate HTTP status codes

#### API Routes

- RESTful endpoints in `@/app/api/`
- Two demo endpoints: `/demo/hello` and `/demo/error`
- Consistent use of error wrapper

### Frontend Components

#### API Client Core (`/lib/api-client.ts`)

- Base fetch wrapper with error handling
- Support for different HTTP methods
- TypeScript generics for request/response typing

#### API Client Modules

- Organized by domain in `/api-clients/`
- Each module includes:
  - Request/response interfaces
  - Typed API methods
  - Domain-specific error handling

#### UI Components

- Client-side components with API integration
- Demo buttons in HomePage(`app/page.tsx`) to demonstrate 2 demo API calls
- Error display using Sonner toasts

## Data Flow

1. User interacts with UI (clicks demo button)
2. Client component calls appropriate API client
3. API client uses core client to make HTTP request
4. Backend processes request through API route
5. Response (success/error) is returned with proper structure
6. API client processes response
7. UI updates based on response (success state or error toast)

## Error Handling Strategy

1. Backend errors are caught and formatted by error wrapper
2. Frontend API client catches HTTP and response errors
3. Errors are displayed to user via Sonner toast notifications
4. Typed error responses enable consistent client-side handling
