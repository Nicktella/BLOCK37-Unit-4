const {
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
    findUserByToken
} = require('./db');

const express = require("express");
const app = express();

app.use(express.json());

const requireAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).send({ error: 'Authorization required' });
    }
    try {
        const token = authHeader.split(' ')[1];
        const user = await findUserByToken(token);
        req.user = user;
        next();
    } catch (err) {
        return res.status(401).send({ error: 'Invalid token' });
    }
};

app.post('/api/products', requireAuth, async (req, res) => {
    try {
        const product = await createProduct(req.body);
        res.status(201).send(product);
    } catch (ex) {
        res.status(500).send({ error: ex.message });
    }
});

app.post('/api/auth/register', async (req, res) => {
    try {
        const user = await createUser(req.body);
        res.status(201).send(user);
    } catch (ex) {
        res.status(500).send({ error: ex.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const user = await authenticate(req.body);
        res.send(user);
    } catch (ex) {
        res.status(401).send({ error: 'Login failed' });
    }
});

app.get('/api/auth/me', requireAuth, async (req, res) => {
    res.send(req.user);
});

app.get('/api/items', async (req, res) => {
    try {
        const items = await fetchItems();
        res.send(items);
    } catch (ex) {
        res.status(500).send({ error: 'Could not fetch items' });
    }
});

app.get('/api/items/:id', async (req, res) => {
    try {
        const item = await fetchItemDetails(req.params.id);
        res.send(item);
    } catch (ex) {
        res.status(404).send({ error: 'Item not found' });
    }
});

app.get('/api/items/:id/reviews', async (req, res) => {
    try {
        const reviews = await fetchReviewsByItem(req.params.id);
        res.send(reviews);
    } catch (ex) {
        res.status(500).send({ error: 'Could not fetch reviews' });
    }
});

app.post('/api/items/:id/reviews', requireAuth, async (req, res) => {
    try {
        const review = await createReview(req.user.id, req.params.id, req.body);
        res.status(201).send(review);
    } catch (ex) {
        res.status(500).send({ error: 'Could not create review' });
    }
});

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

app.get('/api/reviews/me', requireAuth, async (req, res) => {
    try {
        const reviews = await fetchMyReviews(req.user.id);
        res.send(reviews);
    } catch (ex) {
        res.status(500).send({ error: 'Could not fetch reviews' });
    }
});

app.put('/api/reviews/:id', requireAuth, async (req, res) => {
    try {
        const updated = await updateReview(req.params.id, req.user.id, req.body);
        res.send(updated);
    } catch (ex) {
        res.status(500).send({ error: 'Could not update review' });
    }
});

app.delete('/api/reviews/:id', requireAuth, async (req, res) => {
    try {
        await deleteReview(req.params.id, req.user.id);
        res.sendStatus(204);
    } catch (ex) {
        res.status(500).send({ error: 'Could not delete review' });
    }
});

app.post('/api/items/:id/reviews/:reviewId/comments', requireAuth, async (req, res) => {
    try {
        const comment = await createComment(req.user.id, req.params.reviewId, req.body);
        res.status(201).send(comment);
    } catch (ex) {
        res.status(500).send({ error: 'Could not create comment' });
    }
});

app.get('/api/comments/me', requireAuth, async (req, res) => {
    try {
        const comments = await fetchMyComments(req.user.id);
        res.send(comments);
    } catch (ex) {
        res.status(500).send({ error: 'Could not fetch comments' });
    }
});

app.put('/api/comments/:id', requireAuth, async (req, res) => {
    try {
        const updated = await updateComment(req.params.id, req.user.id, req.body);
        res.send(updated);
    } catch (ex) {
        res.status(500).send({ error: 'Could not update comment' });
    }
});

app.delete('/api/comments/:id', requireAuth, async (req, res) => {
    try {
        await deleteComment(req.params.id, req.user.id);
        res.sendStatus(204);
    } catch (ex) {
        res.status(500).send({ error: 'Could not delete comment' });
    }
});

app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500).send({ error: err.message || 'Internal server error.' });
});

const init = async () => {
    const port = process.env.PORT || 3000;
    await client.connect();
    console.log('Connected to database');
    await createTables();
    console.log('Tables created');
    app.listen(port, () => console.log(`Listening on port ${port}`));
};



// Define 10 unique usernames and passwords
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

// Define 10 unique product names
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

// Create users and products concurrently
const createdUsers = users.map(user => createUser(user));
const createdProducts = products.map(product => createProduct(product));

const results = await Promise.all([
    ...createdUsers,
    ...createdProducts
]);

console.log("Users and products created", results);

// Fetch and log all users and products
console.log('All users:', await fetchUsers());
console.log('All products:', await fetchProducts());


init();
