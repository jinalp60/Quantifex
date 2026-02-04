const { User } = require('../models');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
// Note: In a real app, use bcrypt for password hashing and jsonwebtoken for tokens.
// For now, implementing basic logic to port functionality.

exports.signup = async (req, res) => {
    try {
        const { email, password, name } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Create user (TODO: Hash password)
        const user = await User.create({
            email,
            passwordHash: password, // plaintext for dev/demo as requested to keep simple, switch to bcrypt later
            name
        });

        res.status(201).json({ user: { id: user.id, email: user.email, name: user.name } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Signup failed' });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ where: { email } });
        if (!user || user.passwordHash !== password) { // TODO: Use bcrypt.compare
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Update last active
        user.lastActive = new Date();
        await user.save();

        res.json({ user: { id: user.id, email: user.email, name: user.name } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Login failed' });
    }
};

exports.googleLogin = async (req, res) => {
    try {
        const { idToken } = req.body;
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const { email, name, picture, sub: googleId } = payload;

        let user = await User.findOne({ where: { email } });

        if (!user) {
            // Create user if not exists
            user = await User.create({
                email,
                name,
                image: picture,
                // Assign a placeholder password or leave empty if your model allows
                passwordHash: `google_${googleId}`,
                lastActive: new Date()
            });
        } else {
            // Update last active
            user.lastActive = new Date();
            if (picture && !user.image) user.image = picture;
            await user.save();
        }

        res.json({ user: { id: user.id, email: user.email, name: user.name, image: user.image } });
    } catch (error) {
        console.error('Google login error:', error);
        res.status(401).json({ error: 'Google authentication failed' });
    }
};
