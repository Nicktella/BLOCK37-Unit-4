# BLOCK37-Unit-4
Block 37: Unit 4 Career Simulation

# Review Site Backend

## Project Overview
This backend service for a review site is built with Node.js using Express for routing and PostgreSQL for data management. It supports user authentication, product management, review submissions, and comment functionalities. The backend is secured with JWT-based authentication and bcrypt for hashing passwords.

## Installation

### Prerequisites
- Node.js
- npm
- PostgreSQL

### Steps
1. Clone the repository:
git clone <repository-url>

2. Navigate to the project directory:
cd <project-directory>

markdown
Copy code
3. Install dependencies:
npm install

markdown
Copy code
4. Set up your PostgreSQL database and ensure it is running.
5. Create a `.env` file in the root directory and set the following environment variables:
const client = new pg.Client(process.env.DATABASE_URL || 'postgres://localhost/review_database');
JWT_SECRET= (Look inside .env file)
PORT=3000


## Running the Server
Execute the following command to start the server:
npm start

markdown
Copy code
This will also seed the database with initial data.

## API Endpoints

### Authentication
- **Register User**
  - `POST /api/auth/register`: Register a new user.
  - **Body**: `{"username": "user", "password": "pass"}`
- **Login User**
  - `POST /api/auth/login`: Authenticate user and return a JWT.
  - **Body**: `{"username": "user", "password": "pass"}`

### Products
- **Create Product**
  - `POST /api/products`: Create a new product (requires authentication).
  - **Body**: `{"name": "Product Name", "description": "Description", "category": "Category"}`
- **Fetch All Products**
  - `GET /api/items`: Retrieve all products.

### Reviews
- **Create Review**
  - `POST /api/items/:id/reviews`: Post a review for a product (requires authentication).
  - **Body**: `{"rating": 5, "reviewText": "Great product!"}`
- **Fetch Product Reviews**
  - `GET /api/items/:id/reviews`: Get all reviews for a product.

### Comments
- **Post Comment on Review**
  - `POST /api/items/:id/reviews/:reviewId/comments`: Add a comment to a review (requires authentication).
  - **Body**: `{"commentText": "Interesting review!"}`

### User Activities
- **Fetch User Reviews**
  - `GET /api/reviews/me`: Retrieve all reviews by the logged-in user (requires authentication).
- **Update Review**
  - `PUT /api/reviews/:id`: Update a specific review (requires authentication).
  - **Body**: `{"rating": 4, "reviewText": "Updated review text"}`
- **Delete Review**
  - `DELETE /api/reviews/:id`: Delete a specific review (requires authentication).

## Error Handling
All routes are equipped with error handling to provide meaningful error messages and status codes.

## Security
Endpoints requiring user authentication validate the JWT. Passwords are hashed using bcrypt before storage.

## Testing
To test the API endpoints, you can use tools like Postman or write automated tests w
