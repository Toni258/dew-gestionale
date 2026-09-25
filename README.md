# DEW Gestionale RSA

A full-stack web application I built during my bachelor's internship/thesis project for a residential care facility (RSA).

The goal of the project was to build an internal management platform for menus, dishes, users, dish suspensions, and food-related reports, while working with a real shared database already used by a separate mobile app.

This project gave me hands-on experience with frontend development, backend APIs, authentication, role-based access control, SQL data handling, file uploads, production-oriented configuration, and refactoring a real codebase into a more maintainable structure.

## Project overview

The platform supports the daily management of:

- menus
- dishes
- dish suspensions and replacements
- backoffice users
- mobile app users
- operational dashboard data
- food reports and statistics

The application is meant for internal staff use, so the focus was not only on features, but also on protected access, maintainability, data consistency, and compatibility with an existing system.

## Why this project was meaningful for me

While working on this project, I had to deal with:

- a real relational database
- protected backoffice access with multiple user roles
- a shared schema already used by another application
- business rules around menu composition and dish availability
- image upload and static file handling
- reporting/statistics pages with non-trivial backend queries
- environment-based configuration for local and Linux VM deployment
- refactoring large files into more maintainable modules

One of the most important parts of the work was learning how to improve the application while respecting existing constraints, especially the database compatibility required by the mobile app.

## Main features

### Authentication and protected access

- Login/logout flow for backoffice users
- HTTP-only cookie-based session handling
- JWT signed on the backend
- Session validation on protected requests by reloading the current user from the database
- Role-based route protection
- Password reset request and forced password change flow

### Dish management

- Create, edit, and delete dishes
- Upload dish images
- Store nutritional values, allergens, and dish type
- Suspend dishes for a date range
- Preview menu conflicts before applying a suspension
- Safely replace suspended dishes in menus

### Menu management

- Create, edit, and delete active menus
- Manage daily meal composition
- Manage fixed dishes and cheese rotation
- Archive completed menus
- Read archived menus in a dedicated read-only area

### User management

- Manage backoffice users
- Manage users connected to the mobile app
- Suspend, reactivate, and remove users
- Admin password reset flows

### Dashboard and reporting

- Dashboard with operational alerts and useful shortcuts
- Overview of active dish suspensions
- Menu-related progress and checks
- Reports and statistics for food consumption and user choices

## Tech stack

### Frontend

- React
- React Router
- Vite
- Tailwind CSS
- Reusable custom UI components
- Hooks-based state management

### Backend

- Node.js
- Express
- MySQL
- JWT
- Multer for uploads
- Cron jobs / scheduled tasks

## Architecture

The codebase follows a layered structure to keep responsibilities separated.

### Backend

- `routes`
- `controllers`
- `services`
- `repositories`
- `db`
- `middlewares`
- `config`
- `utils`

### Frontend

- `pages`
- `components`
- `hooks`
- `services`
- `context`
- `utils`

During the refactor phase, I focused on reducing oversized files, moving business logic out of heavier controllers/pages, and introducing reusable pieces where that improved readability without overcomplicating the project.

## Design and implementation choices

Some implementation choices that were especially important in this project:

- JWTs are signed on the backend using a secret from environment variables
- Protected requests do not trust stale role/status information from the token alone: the current user is reloaded from the database
- Uploads are restricted to supported image types and a configured size limit
- Static file storage is configurable through environment variables
- Background scheduler execution is protected with a MySQL named lock, so the same job does not run concurrently across multiple backend processes

## A business constraint I had to respect

One important part of the project was working with a database that was already shared with a separate mobile application.

That meant I could not freely redesign existing shared tables just to make the web app cleaner.

Instead, I had to:

- understand the existing schema
- keep compatibility with the mobile app
- introduce safer improvements only where they were compatible
- add new support structures when necessary instead of breaking existing behavior

A good example is the dish suspension workflow: to make suspension restore logic safer, I added a dedicated tracking table for replacement pairings instead of changing shared core tables.

## What I learned from this project

This project helped me improve in several areas at the same time:

- building end-to-end full-stack features
- translating business requirements into code
- working with an existing schema and real constraints
- reasoning about authentication and protected access
- writing and debugging SQL
- refactoring an existing codebase instead of starting from scratch
- thinking about maintainability and deployability, not only correctness

## Local setup

### Frontend

```bash
npm install
npm run dev
```

### Backend

```bash
cd backend
npm install
npm run dev
```

## Environment variables

The project uses environment variables for:

- API configuration
- database connection
- authentication
- static file storage
- scheduler behavior

Example values are provided in:

- `.env.example`
- `backend/.env.example`

The complete list is documented in the example env files and in `DEPLOY.md`.

## Database notes

This project works on top of an existing database already used by a mobile app.

For a fresh local setup, the general flow is:

1. import the base SQL dump
2. apply the project patch

## Runtime folders

The project uses runtime folders such as:

- `storage/food-images/`
- `logs/`

These are intentionally configurable so the same codebase can work both locally and in a Linux deployment environment.

## Deploy notes

The backend exposes:

- `GET /health`

The repository also includes deploy-oriented material such as:

- `DEPLOY.md`
- PM2 configuration
- Nginx configuration

## Final note

This project was a very important part of my bachelor's path because it gave me the opportunity to work on software with real constraints, real users, and real maintenance concerns.

More than anything, it helped me understand that good software is not only about implementing features, but also about making reasonable technical decisions, respecting constraints, and leaving the project in a state that another developer can understand and continue.
