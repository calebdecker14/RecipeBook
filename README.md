# RecipeBook





What Each File Does: (Update it as needed)
server.js
- Starts the Express server
- Loads middleware (JSON parsing, etc.)
- Connects route files (like /auth)
- Listens for incoming requests
package.json
- Lists all project dependencies (Express, bcrypt, JWT, MySQL2, etc.)
- Defines scripts like npm start
- Stores project metadata
.env
- Stores sensitive configuration values (DB credentials, JWT secret)
- Keeps secrets out of the codebase
test.http
- Used to send test API requests directly from VS Code
- Helpful for testing /auth/register and /auth/login

controllers/
- Contains the logic for handling requests
- Each controller function decides what happens when a route is hit
controllers/authController.js
- Handles user registration and login
- Hashes passwords, checks credentials, creates JWT tokens
- Communicates with the database through the pool

routes/
- Defines the API endpoints (URLs) the frontend calls
- Maps URLs to controller functions
routes/auth.js
- POST /auth/register → register a user
- POST /auth/login → log in a user

db/
- Handles database connections
db/pool.js
- Creates a reusable MySQL connection pool
- Allows controllers to run SQL queries efficiently

node_modules/
- Automatically generated folder containing all installed dependencies
- Never edited manually

README.md
- Project documentation
- Explains how to run the backend and how the system works

