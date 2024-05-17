// Import necessary modules and functions from db.js
const {
    client,
    createTables,
    createUser,
    createProduct,
    createReview,
    fetchItems,
    fetchProducts,
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
} = require('./db');

const express = require("express");
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Middleware to check if a user is logged in by verifying the JWT token
const isLoggedIn = async (req, res, next) => {
    try {
        console.log("req.headers", req.headers.authorization);
        req.headers.authorization = req.headers.authorization.replace("Bearer ", "");
        req.user = await findUserWithToken(req.headers.authorization);
        console.log("After", req.headers.authorization);
        next();
    } catch (error) {
        res.status(401).send({ error: 'Unauthorized' });
    }
};

// Route to create a new product, only accessible to logged-in users
app.post('/api/products', isLoggedIn, async (req, res) => {
    try {
        const product = await createProduct(req.body);
        res.status(201).send(product);
    } catch (ex) {
        res.status(500).send({ error: ex.message });
    }
});

// Route to register a new user
app.post('/api/auth/register', async (req, res) => {
    try {
        const user = await createUser(req.body);
        res.status(201).send(user);
    } catch (ex) {
        res.status(500).send({ error: ex.message });
    }
});

// Route to login a user and return a JWT token
app.post('/api/auth/login', async (req, res) => {
    try {
        const token = await authenticate(req.body);
        res.send(token);
    } catch (ex) {
        res.status(401).send({ error: 'Login failed' });
    }
});

// Route to get the logged-in user's details
app.get('/api/auth/me', isLoggedIn, async (req, res) => {
    try {
        res.send(req.user);
    } catch (ex) {
        res.status(500).send({ error: 'Could not fetch user' });
    }
});

// Route to fetch all items
app.get('/api/items', async (req, res) => {
    try {
        const items = await fetchItems();
        res.send(items);
    } catch (ex) {
        res.status(500).send({ error: 'Could not fetch items' });
    }
});

// Route to fetch details of a specific item
app.get('/api/items/:id', async (req, res) => {
    try {
        const item = await fetchItemDetails(req.params.id);
        res.send(item);
    } catch (ex) {
        res.status(404).send({ error: 'Item not found' });
    }
});

// Route to fetch all reviews for a specific item
app.get('/api/items/:id/reviews', async (req, res) => {
    try {
        const reviews = await fetchReviewsByItem(req.params.id);
        res.send(reviews);
    } catch (ex) {
        res.status(500).send({ error: 'Could not fetch reviews' });
    }
});

// Route to create a new review for a specific item, only accessible to logged-in users
app.post('/api/items/:id/reviews', isLoggedIn, async (req, res) => {
    try {
        const review = await createReview({
            userId: req.user.id,
            itemId: req.params.id,
            rating: req.body.rating,
            reviewText: req.body.reviewText
        });
        res.status(201).send(review);
    } catch (ex) {
        res.status(500).send({ error: 'Could not create review' });
    }
});

// Route to fetch details of a specific review
app.get('/api/reviews/:reviewId', async (req, res) => {
    try {
        const review = await fetchReview(req.params.reviewId);
        if (!review) {
            res.status(404).send({ error: 'Review not found' });
        } else {
            res.send(review);
        }
    } catch (ex) {
        res.status(500).send({ error: 'Could not fetch review' });
    }
});

// Route to fetch all reviews written by the logged-in user
app.get('/api/reviews/me', isLoggedIn, async (req, res) => {
    try {
        const reviews = await fetchMyReviews(req.user.id);
        res.send(reviews);
    } catch (ex) {
        res.status(500).send({ error: 'Could not fetch reviews' });
    }
});

// Route to update a specific review, only accessible to the user who wrote the review
app.put('/api/reviews/:id', isLoggedIn, async (req, res) => {
    try {
        const updated = await updateReview({
            reviewId: req.params.id,
            userId: req.user.id,
            rating: req.body.rating,
            reviewText: req.body.reviewText
        });
        res.send(updated);
    } catch (ex) {
        res.status(500).send({ error: 'Could not update review' });
    }
});

// Route to delete a specific review, only accessible to the user who wrote the review
app.delete('/api/reviews/:id', isLoggedIn, async (req, res) => {
    try {
        await deleteReview({ reviewId: req.params.id, userId: req.user.id });
        res.sendStatus(204);
    } catch (ex) {
        res.status(500).send({ error: 'Could not delete review' });
    }
});

// Route to create a comment on a specific review, only accessible to logged-in users
app.post('/api/items/:id/reviews/:reviewId/comments', isLoggedIn, async (req, res) => {
    try {
        const comment = await createComment({
            reviewId: req.params.reviewId,
            userId: req.user.id,
            commentText: req.body.commentText
        });
        res.status(201).send(comment);
    } catch (ex) {
        res.status(500).send({ error: 'Could not create comment' });
    }
});

// Route to fetch all comments written by the logged-in user
app.get('/api/comments/me', isLoggedIn, async (req, res) => {
    try {
        const comments = await fetchMyComments(req.user.id);
        res.send(comments);
    } catch (ex) {
        res.status(500).send({ error: 'Could not fetch comments' });
    }
});

// Route to update a specific comment, only accessible to the user who wrote the comment
app.put('/api/comments/:id', isLoggedIn, async (req, res) => {
    try {
        const updated = await updateComment({
            commentId: req.params.id,
            userId: req.user.id,
            commentText: req.body.commentText
        });
        res.send(updated);
    } catch (ex) {
        res.status(500).send({ error: 'Could not update comment' });
    }
});

// Route to delete a specific comment, only accessible to the user who wrote the comment
app.delete('/api/comments/:id', isLoggedIn, async (req, res) => {
    try {
        await deleteComment({ commentId: req.params.id, userId: req.user.id });
        res.sendStatus(204);
    } catch (ex) {
        res.status(500).send({ error: 'Could not delete comment' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500).send({ error: err.message || 'Internal server error.' });
});

// Function to seed the database with dummy data
const seedDatabase = async () => {
    const users = [
        { username: "AstroNomad", password: "Galaxy*123" },
        { username: "QuantumLeap", password: "Quark*789" },
        { username: "CosmicRay", password: "Nebula*456" },
        { username: "StarGazer", password: "Orion*234" },
        { username: "NovaPioneer", password: "Nova*321" },
        { username: "MoonWalker", password: "Crater*654" },
        { username: "SolarSailor", password: "Sail*987" },
        { username: "GalaxyGuard", password: "Guardian*852" },
        { username: "MeteorSeeker", password: "Meteor*963" },
        { username: "CometChaser", password: "Comet*741" }
    ];

    const products = [
        { name: "StarTracker" },
        { name: "NebulaNavigator" },
        { name: "QuantumCompass" },
        { name: "GalacticLens" },
        { name: "AstroScope" },
        { name: "CosmoMeter" },
        { name: "OrbitOval" },
        { name: "VortexViewer" },
        { name: "SolarScope" },
        { name: "PhotonFinder" }
    ];

    await Promise.all(users.map(user => createUser(user)));
    await Promise.all(products.map(product => createProduct(product)));

    console.log("Users and products created");
};

// Function to initialize the server
const init = async () => {
    try {
        const port = process.env.PORT || 3000;
        await client.connect();
        console.log('Connected to database');

        await createTables();
        console.log('Tables created');

        await seedDatabase();

        app.listen(port, () => console.log(`Listening on port ${port}`));
        console.log('Server started successfully');

        console.log('All users:', await fetchUsers());
        console.log('All products:', await fetchProducts());
    } catch (error) {
        console.error('Failed to initialize the server:', error);
    }
};

init();
