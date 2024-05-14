require("dotenv").config();
const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL || 'postgres://localhost/review_database');
const uuid = require('uuid');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const JWT = process.env.JWT;

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

const createUser = async ({ username, password }) => {
    const hashPassword = await bcrypt.hash(password, 10);
    const SQL = 'INSERT INTO users (id, username, password) VALUES ($1, $2, $3) RETURNING *';
    const response = await client.query(SQL, [uuid.v4(), username, hashPassword]);
    return response.rows[0];
};

const createProduct = async ({ name, description, category }) => {
    const SQL = 'INSERT INTO items (id, name, description, category) VALUES ($1, $2, $3, $4) RETURNING *';
    const response = await client.query(SQL, [uuid.v4(), name, description, category]);
    return response.rows[0];
};

const createReview = async ({ userId, itemId, rating, reviewText }) => {
    const SQL = 'INSERT INTO reviews (id, user_id, item_id, rating, review_text) VALUES ($1, $2, $3, $4, $5) RETURNING *';
    const response = await client.query(SQL, [uuid.v4(), userId, itemId, rating, reviewText]);
    return response.rows[0];
};

const fetchItems = async () => {
    const SQL = 'SELECT * FROM items';
    const response = await client.query(SQL);
    return response.rows;
};

const fetchItemDetails = async (itemId) => {
    const SQL = 'SELECT * FROM items WHERE id = $1';
    const response = await client.query(SQL, [itemId]);
    return response.rows[0];
};

const fetchReviewsByItem = async (itemId) => {
    const SQL = 'SELECT r.*, u.username FROM reviews r JOIN users u ON r.user_id = u.id WHERE item_id = $1';
    const response = await client.query(SQL, [itemId]);
    return response.rows;
};

const fetchReview = async (reviewId) => {
    const SQL = 'SELECT * FROM reviews WHERE id = $1';
    const response = await client.query(SQL, [reviewId]);
    return response.rows[0];
};

const fetchMyReviews = async (userId) => {
    const SQL = 'SELECT * FROM reviews WHERE user_id = $1';
    const response = await client.query(SQL, [userId]);
    return response.rows;
};

const updateReview = async ({ reviewId, userId, rating, reviewText }) => {
    const SQL = 'UPDATE reviews SET rating = $1, review_text = $2 WHERE id = $3 AND user_id = $4 RETURNING *';
    const response = await client.query(SQL, [rating, reviewText, reviewId, userId]);
    return response.rows[0];
};

const deleteReview = async ({ reviewId, userId }) => {
    const SQL = 'DELETE FROM reviews WHERE id = $1 AND user_id = $2';
    await client.query(SQL, [reviewId, userId]);
};

const createComment = async ({ reviewId, userId, commentText }) => {
    const SQL = 'INSERT INTO comments (id, review_id, user_id, comment_text) VALUES ($1, $2, $3, $4) RETURNING *';
    const response = await client.query(SQL, [uuid.v4(), reviewId, userId, commentText]);
    return response.rows[0];
};

const fetchMyComments = async (userId) => {
    const SQL = 'SELECT * FROM comments WHERE user_id = $1';
    const response = await client.query(SQL, [userId]);
    return response.rows;
};

const updateComment = async ({ commentId, userId, commentText }) => {
    const SQL = 'UPDATE comments SET comment_text = $1 WHERE id = $2 AND user_id = $3 RETURNING *';
    const response = await client.query(SQL, [commentText, commentId, userId]);
    return response.rows[0];
};

const deleteComment = async ({ commentId, userId }) => {
    const SQL = 'DELETE FROM comments WHERE id = $1 AND user_id = $2';
    await client.query(SQL, [commentId, userId]);
};

const authenticate = async ({ username, password }) => {
    const SQL = 'SELECT id, password FROM users WHERE username = $1';
    const response = await client.query(SQL, [username]);
    if (!response.rows.length || !(await bcrypt.compare(password, response.rows[0].password))) {
        throw new Error('Authentication failed');
    }
    const token = jwt.sign({ id: response.rows[0].id }, JWT);
    return { token };
};

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
    findUserWithToken
};
