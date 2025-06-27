# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Package Management
This project uses both npm and bun. Use bun for installation: `bun install`

### Core Development Commands
- `npm run dev` - Start development server on http://localhost:5173
- `npm run build` - Build for production (TypeScript compilation + Vite build)
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build locally
- `npm run start` - Start preview server with specific port/host config

### Deployment
- `npm run predeploy` - Build before deployment
- `npm run deploy` - Deploy to GitHub Pages using gh-pages

## Architecture Overview

### Frontend Framework Stack
- **React 18** with TypeScript in strict mode
- **Vite** as build tool and dev server
- **React Router v7** for client-side routing
- **ESLint** for code quality

### Authentication & API Architecture
The app uses a sophisticated token-based authentication system:

1. **API Client Layer** (`src/services/apiClient.ts`):
   - Centralized HTTP client with automatic token management
   - Automatic token refresh on 401 responses
   - Custom auth events dispatched to window for state management

2. **Common API Wrapper** (`src/api/common/client.ts`):
   - Retry logic with exponential backoff
   - Timeout handling (10s default, 60s for uploads)
   - Unified error handling
   - Convenience methods: `apiGet`, `apiPost`, `apiPut`, `apiDelete`
   - Specialized `fetchPaginatedData` and `uploadFile` methods

3. **Token Service** (`src/services/tokenService.ts`):
   - Manages access/refresh token storage in localStorage
   - Provides centralized token operations

### Application Structure

#### Routing & Authentication
- **Protected Routes**: All main app routes require authentication via `ProtectedLayout` component
- **Route Structure**: 
  - `/login` - Public login page
  - `/` - Dashboard/home (protected)
  - `/users`, `/locations`, `/reservations` - Main entity management (protected)
  - `/scraping` - Data scraping interface (protected)

#### Page Architecture
The app follows a modular page-based architecture:

- **Entity Management Pages**: Users, Locations, Reservations each have:
  - List view with filtering, pagination, and bulk actions
  - Detail/edit view for individual items
  - Create new item workflows
  
- **Location Creation**: Multi-step wizard with validation:
  - Steps: Owner Selection → Basic Info → Activity Types → Availability → Pricing → Review
  - Each step has validation and can maintain state across navigation

#### API Integration Patterns

**Type Safety**: All API responses use strongly-typed interfaces defined in `src/api/common/types.ts`:
- `User`, `Location`, `Reservation` core entities
- `ApiResponse<T>` and `PaginatedResponse<T>` wrappers
- Consistent error handling via `src/api/common/errors.ts`

**API Module Structure**: Each domain has its own API module (`src/api/{domain}/api.ts`):
- Users: CRUD operations, filtering, bulk updates
- Locations: CRUD, filtering, owner assignment, status management
- Reservations: Retrieval, status updates
- Auth: Login, logout, token refresh, user session

**Navigation Component**: `NavigationLayout.tsx` provides:
- Responsive sidebar navigation
- User session display and logout
- Route-based active state management

### Environment Configuration
- API URL configured via `VITE_API_URL` environment variable
- Defaults to `http://localhost:3000/api` for development
- Build output configured for GitHub Pages deployment (`base: '/locatrova-admin-fe/'`)

### Development Patterns

#### State Management
- Uses React hooks (useState, useEffect, useCallback) for local state
- No global state management library
- Authentication state managed through protected route pattern

#### TypeScript Usage
- Strict TypeScript configuration with multiple tsconfig files
- Interface definitions centralized in `src/api/common/types.ts`
- Comprehensive type coverage for all API interactions

#### Error Handling
- Centralized error handling in API client layer
- User-friendly error messages with toast notifications
- Automatic retry logic for network failures

#### Form Handling
- Custom form components with validation
- Multi-step wizards maintain state across steps
- File upload support with progress indication

## Key Technical Considerations

### API Response Handling
Always use the typed API wrapper functions rather than direct fetch calls. The API returns data in a consistent format with `success`, `data`, and optional `message`/`error` fields.

### Authentication Flow
The app automatically handles token refresh. When working with protected endpoints, the API client will attempt token refresh on 401 responses and dispatch auth events for UI updates.

### Build & Deployment
The project is configured for GitHub Pages deployment with a base path. Source maps are enabled for debugging production builds.