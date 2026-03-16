# DEW Gestionale RSA

This project is a full-stack web application developed for a residential care facility (RSA) during my bachelor's internship/thesis work.

The application was created to support the internal management of menus, dishes, users, dish suspensions, and food-related reports.

## Project goal

The main goal of the project was to create a web management platform for the staff, connected to an existing database already used by a separate mobile application.

Because of this, the project had to support new web features while remaining compatible with the shared database structure.

## Main functionalities

### Authentication and access control

- Login and logout for backoffice users
- Protected routes
- Role-based access control
- Password reset request flow
- Forced password change flow

### Dish management

- Create, edit, and delete dishes
- Upload dish images
- Manage nutritional values and allergens
- Suspend dishes for a selected date range
- Preview conflicts before applying a suspension
- Replace suspended dishes inside menus

### Menu management

- Create and edit menus
- Manage daily meal composition
- Manage fixed dishes
- Manage cheese rotation
- Archive completed menus
- View archived menus in a read-only section

### User management

- Manage backoffice users
- Manage users linked to the mobile application
- Suspend, reactivate, and remove users

### Dashboard and reports

- Dashboard with alerts and operational information
- Overview of active dish suspensions
- Menu-related checks
- Reports and statistics about consumption and user choices

## Technologies used

### Frontend

- React
- React Router
- Vite
- Tailwind CSS

### Backend

- Node.js
- Express
- MySQL
- JWT
- Multer

## Project structure

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

## Technical notes

Some relevant implementation details:

- backoffice authentication uses an HTTP-only cookie
- JWTs are signed on the backend
- protected requests reload the current user from the database
- image uploads are validated and stored through configurable paths
- static file paths are managed through environment variables
- background scheduler execution is protected with a MySQL named lock

## Database constraint

One important constraint of the project is that part of the database is shared with a separate mobile application.

For this reason, I could not redesign shared tables freely.  
The implementation had to remain compatible with the existing schema while adding the new web management logic.

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

## Deploy notes

The backend exposes:

- `GET /health`

The repository also includes:

- `DEPLOY.md`
- PM2 configuration
- Nginx configuration
