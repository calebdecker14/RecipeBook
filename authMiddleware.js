const jwt = require('jsonwebtoken');

// middleware to verify JWT from Authorization header
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.sendStatus(401);

    const token = authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        // attach decoded user info to request
        req.user = user;
        next();
    });
}

module.exports = { authenticateToken };
