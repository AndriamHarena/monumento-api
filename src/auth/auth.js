const jwt = require('jsonwebtoken');
const fs = require('fs');
const publicKey = fs.readFileSync('./src/auth/jwtRS256.key.pub');

module.exports = (req, res, next) => {

    if(req.path === '/api/login' || req.path === '/api/register' || req.path === '/api/refresh-token' || req.path === '/api-docs' || req.path.startsWith('/api-docs/')) {
        return next();
    }

    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ message: "Token d'authentification manquant", data: null });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: "Token d'authentification manquant", data: null });
    }

    jwt.verify(token, publicKey, { algorithms: ['RS256'] }, (err, user) => {
        if (err) {
            return res.status(403).json({ message: "Token d'authentification invalide", data: null });
        }
        req.user = user;
        next();
    });
};