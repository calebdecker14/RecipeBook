const jwt = require('jsonwebtoken');

// middleware to verify JWT from Authorization header
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.sendStatus(401);

    const token = authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.sendStatus(403);
    
    // Check your terminal for this output!
    console.log("--- TOKEN DECODED ---");
    console.log(decoded); 

    req.user = decoded; 
    next();
});
}

module.exports = { authenticateToken };
