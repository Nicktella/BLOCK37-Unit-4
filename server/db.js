require("dotenv").config();
const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL || 'postgres://localhost/review_database');
const uuid = require('uuid');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const JWT = process.env.JWT;

// Function to create all necessary tables
const createTables = async () => {
    const SQL = `
    DROP TABLE IF EXISTS comments;
    DROP TABLE IF EXISTS reviews;
    DROP TABLE IF EXISTS favorites;
    DROP TABLE IF EXISTS users;
    DROP TABLE IF EXISTS items;
    CREATE TABLE users (
      id UUID PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL
    );
    CREATE TABLE items (
      id UUID PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      description TEXT,
      category VARCHAR(255)
    );
    CREATE TABLE reviews (
      id UUID PRIMARY KEY,
      user_id UUID REFERENCES users(id),
      item_id UUID REFERENCES items(id),
      rating INTEGER,
      review_text TEXT,
      CONSTRAINT unique_user_item UNIQUE (user_id, item_id)
    );
    CREATE TABLE comments (
      id UUID PRIMARY KEY,
      review_id UUID REFERENCES reviews(id),
      user_id UUID REFERENCES users(id),
      comment_text TEXT
    );
    CREATE TABLE favorites (
      id UUID PRIMARY KEY,
      user_id UUID REFERENCES users(id),
      item_id UUID REFERENCES items(id),
      CONSTRAINT unique_user_id_and_product_id UNIQUE (user_id, item_id)
    );
  `;
    await client.query(SQL);
};

// Function to fetch all users
const fetchUsers = async () => {
    try {
        const query = 'SELECT * FROM users';
        const { rows } = await client.query(query);
        return rows;
    } catch (error) {
        throw new Error('Error fetching users');
    }
};

// Function to create a new user with hashed password
const createUser = async ({ username, password }) => {
    const hashPassword = await bcrypt.hash(password, 10);
    const SQL = 'INSERT INTO users (id, username, password) VALUES ($1, $2, $3) RETURNING *';
    const response = await client.query(SQL, [uuid.v4(), username, hashPassword]);
    return response.rows[0];
};

// Function to fetch all products
const fetchProducts = async () => {
    const SQL = 'SELECT * FROM items';
    const response = await client.query(SQL);
    return response.rows;
};

// Function to create a new product
const createProduct = async ({ name, description, category }) => {
    const SQL = 'INSERT INTO items (id, name, description, category) VALUES ($1, $2, $3, $4) RETURNING *';
    const response = await client.query(SQL, [uuid.v4(), name, description, category]);
    return response.rows[0];
};

// Function to create a new review
const createReview = async ({ userId, itemId, rating, reviewText }) => {
    const SQL = 'INSERT INTO reviews (id, user_id, item_id, rating, review_text) VALUES ($1, $2, $3, $4, $5) RETURNING *';
    const response = await client.query(SQL, [uuid.v4(), userId, itemId, rating, reviewText]);
    return response.rows[0];
};

// Function to fetch all items
const fetchItems = async () => {
    const SQL = 'SELECT * FROM items';
    const response = await client.query(SQL);
    return response.rows;
};

// Function to fetch details of a specific item
const fetchItemDetails = async (itemId) => {
    const SQL = 'SELECT * FROM items WHERE id = $1';
    const response = await client.query(SQL, [itemId]);
    return response.rows[0];
};

// Function to fetch all reviews for a specific item
const fetchReviewsByItem = async (itemId) => {
    const SQL = 'SELECT r.*, u.username FROM reviews r JOIN users u ON r.user_id = u.id WHERE item_id = $1';
    const response = await client.query(SQL, [itemId]);
    return response.rows;
};

// Function to fetch details of a specific review
const fetchReview = async (reviewId) => {
    const SQL = 'SELECT * FROM reviews WHERE id = $1';
    const response = await client.query(SQL, [reviewId]);
    return response.rows[0];
};

// Function to fetch all reviews written by a specific user
const fetchMyReviews = async (userId) => {
    const SQL = 'SELECT * FROM reviews WHERE user_id = $1';
    const response = await client.query(SQL, [userId]);
    return response.rows;
};

// Function to update a specific review
const updateReview = async ({ reviewId, userId, rating, reviewText }) => {
    const SQL = 'UPDATE reviews SET rating = $1, review_text = $2 WHERE id = $3 AND user_id = $4 RETURNING *';
    const response = await client.query(SQL, [rating, reviewText, reviewId, userId]);
    return response.rows[0];
};

// Function to delete a specific review
const deleteReview = async ({ reviewId, userId }) => {
    const SQL = 'DELETE FROM reviews WHERE id = $1 AND user_id = $2';
    await client.query(SQL, [reviewId, userId]);
};

// Function to create a new comment
const createComment = async ({ reviewId, userId, commentText }) => {
    const SQL = 'INSERT INTO comments (id, review_id, user_id, comment_text) VALUES ($1, $2, $3, $4) RETURNING *';
    const response = await client.query(SQL, [uuid.v4(), reviewId, userId, commentText]);
    return response.rows[0];
};

// Function to fetch all comments written by a specific user
const fetchMyComments = async (userId) => {
    const SQL = 'SELECT * FROM comments WHERE user_id = $1';
    const response = await client.query(SQL, [userId]);
    return response.rows;
};

// Function to update a specific comment
const updateComment = async ({ commentId, userId, commentText }) => {
    const SQL = 'UPDATE comments SET comment_text = $1 WHERE id = $2 AND user_id = $3 RETURNING *';
    const response = await client.query(SQL, [commentText, commentId, userId]);
    return response.rows[0];
};

// Function to delete a specific comment
const deleteComment = async ({ commentId, userId }) => {
    const SQL = 'DELETE FROM comments WHERE id = $1 AND user_id = $2';
    await client.query(SQL, [commentId, userId]);
};

// Function to authenticate a user and return a JWT token
const authenticate = async ({ username, password }) => {
    const SQL = 'SELECT id, password FROM users WHERE username = $1';
    const response = await client.query(SQL, [username]);
    if (!response.rows.length || (await bcrypt.compare(password, response.rows[0].password)) === false) {
        const error = Error("Failed");
        error.status = 401;
        throw error;
    }
    const token = await jwt.sign({ id: response.rows[0].id }, JWT);
    console.log("Token from db.js", token)
    return { token };
};

// Function to find a user by their JWT token
const findUserWithToken = async (token) => {
    try {
        const decoded = jwt.verify(token, JWT);
        const SQL = 'SELECT id, username FROM users WHERE id = $1';
        const response = await client.query(SQL, [decoded.id]);
        if (!response.rows.length) {
            throw new Error('User not found');
        }
        return response.rows[0];
    } catch (err) {
        throw new Error('Invalid token');
    }
};

module.exports = {
    client,
    createTables,
    createUser,
    fetchProducts,
    createProduct,
    createReview,
    fetchItems,
    fetchItemDetails,
    fetchReviewsByItem,
    fetchReview,
    fetchMyReviews,
    updateReview,
    deleteReview,
    createComment,
    fetchMyComments,
    updateComment,
    deleteComment,
    authenticate,
    fetchUsers,
    findUserWithToken
};
