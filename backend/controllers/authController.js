const { User } = require('../models');
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
