# Monumento API

A Node.js + Express + Sequelize REST API for managing monuments, anecdotes, favorites, and real-time notifications via WebSocket (Socket.IO).

## Features

- Monuments CRUD with validation
- Anecdotes per monument
- Users authentication with JWT RS256 (access + refresh tokens)
- Favorites: Many-to-Many between Users and Monuments via `Favorite`
- Real-time notifications (Socket.IO) when a new monument is created
- Simple in-repo HTML client to test WebSocket notifications
- Swagger/OpenAPI docs bootstrapped

## Tech Stack

- Node.js, Express
- Sequelize ORM, MySQL
- JWT (RS256) for auth
- Socket.IO for WebSocket
- Swagger/OpenAPI (docs)

## Project Structure

```
monumento-api/
├─ server.js
├─ src/
│  ├─ auth/
│  │  ├─ auth.js
│  │  ├─ jwtRS256.key           (private key, not committed)
│  │  └─ jwtRS256.key.pub       (public key)
│  ├─ db/
│  │  ├─ sequelize.js
│  │  └─ monuments-list.js      (optional seed list)
│  ├─ docs/
│  ├─ models/
│  │  ├─ monument.js
│  │  ├─ anecdote.js
│  │  ├─ user.js
│  │  └─ favorite.js
│  ├─ routes/
│  │  ├─ createMonument.route.js
│  │  ├─ updateMonument.route.js
│  │  ├─ deleteMonument.route.js
│  │  ├─ findAllMonuments.route.js
│  │  ├─ searchMonuments.route.js
│  │  ├─ findMonumentByPK.route.js
│  │  ├─ createAnecdotes.route.js
│  │  ├─ updateAnecdote.route.js
│  │  ├─ deleteAnecdote.route.js
│  │  ├─ login.route.js
│  │  ├─ register.route.js
│  │  ├─ refreshToken.route.js
│  │  └─ favorites.route.js
│  ├─ socket/
│  │  └─ index.js
│  └─ helper.js
├─ client/
│  └─ test-socket.html
└─ README.md
```

## Prerequisites

- Node.js 18+
- MySQL 8+
- OpenSSL (for generating RSA keys if needed)

## Configuration

Database connection is configured in `src/db/sequelize.js`:

```js
new Sequelize('monumento', 'root', '', {
  host: 'localhost',
  port: 3306,
  dialect: 'mysql',
  logging: true,
});
```

Adjust credentials as needed. Ensure the `monumento` database exists, or create it.

### JWT Keys

Place your RSA keys in `src/auth/`:
- `jwtRS256.key` (private, used for signing)
- `jwtRS256.key.pub` (public, used for verification)

These are loaded in:
- `src/routes/login.route.js` (private key)
- `src/auth/auth.js` and `src/socket/index.js` (public key)

## Install & Run

```bash
# install dependencies
npm install

# start server (http://localhost:3000)
npm start
```

The server also starts Socket.IO on the same port and serves the test client at:
- http://localhost:3000/client/test-socket.html

Swagger docs are mounted by `require('./src/docs/swagger')(app)` if present.

## Authentication

- Register: `POST /api/register`
- Login: `POST /api/login` → returns `accessToken` and `refreshToken`
- Refresh: `POST /api/refresh-token`

All protected endpoints require `Authorization: Bearer <accessToken>`.

## Monuments Endpoints (selection)

- `GET /api/monuments` — list all (with filters and search routes available)
- `GET /api/monuments/:id` — fetch by id
- `POST /api/monuments` — create monument
  - Body format:
    ```json
    {
      "monument": {
        "title": "Arc de Triomphe",
        "country": "France",
        "city": "Paris",
        "buildYear": 1836,
        "picture": "https://...",
        "description": "..."
      }
    }
    ```
- `PUT /api/monuments/:id` — update
- `DELETE /api/monuments/:id` — delete

Validation for `Monument` is enforced in `src/models/monument.js`.

## Anecdotes Endpoints (selection)

- `GET /api/monuments/:id/anecdotes` — list by monument
- `POST /api/anecdotes` — create
- `PUT /api/anecdotes/:id` — update
- `DELETE /api/anecdotes/:id` — delete

## Favorites API

Implemented via `Favorite` join table (Many-to-Many User ↔ Monument).

- `POST /api/favorites/:monumentId` — add a monument to the current user favorites
  - 400 if already in favorites
  - 404 if monument does not exist
- `DELETE /api/favorites/:monumentId` — remove from favorites
  - 404 if not in favorites
- `GET /api/favorites` — list current user favorite monuments

All return errors via `helper.js` → `handleError`.

## Real-time Notifications (Socket.IO)

Whenever a new monument is created via `POST /api/monuments`, the server emits a notification to all connected clients:

- Event name (envelope): `notification`
- Payload:
  ```json
  {
    "event": "newMonument",
    "data": {
      "id": 15,
      "title": "Arc de Triomphe",
      "description": "Construit pour célébrer les victoires de Napoléon",
      "createdAt": "2025-09-19T10:15:00Z"
    }
  }
  ```

The `createdAt` sent over WebSocket intentionally strips milliseconds to match the spec.

### Testing WebSocket

Open the built-in test page:
- http://localhost:3000/client/test-socket.html

Steps:
- Obtain an `accessToken` via `POST /api/login`.
- Paste the token in the page and click “Connect”.
- Use the form to create a new monument.
- Observe the incoming `newMonument` notification in logs.

The Socket.IO server requires the token in the handshake:
```js
io(server, { /* ... */ })
// client
io('http://localhost:3000', { auth: { token: '<ACCESS_TOKEN>' } })
```

## Quick Favorite Testing (Postman/Thunder)

- Add favorite:
  - `POST http://localhost:3000/api/favorites/1`
  - Headers: `Authorization: Bearer <ACCESS_TOKEN>`
- List favorites:
  - `GET http://localhost:3000/api/favorites`
  - Headers: `Authorization: Bearer <ACCESS_TOKEN>`
- Remove favorite:
  - `DELETE http://localhost:3000/api/favorites/1`
  - Headers: `Authorization: Bearer <ACCESS_TOKEN>`

## Troubleshooting

- 401/403 on API or Socket.IO: check your access token (and that the public/private keys are correct).
- "Token d'authentification manquant" on `/client/test-socket.html`:
  - Ensure in `server.js` that `app.use('/client', express.static(...))` is registered before `app.use(auth)`.
- Monument creation fails:
  - Ensure the request body uses the `monument` envelope and includes `title`, `country`, `city`.
- No WebSocket notifications:
  - Ensure both the server and the client use the same host/port and that you are connected.

## Scripts

You can define npm scripts like these in `package.json` (example):

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

## License

This project is for educational purposes. 
