import { User } from '../models/index.js';
import { OAuth2Client } from 'google-auth-library';
import bcrypt from 'bcryptjs';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
// Note: In a real app, use bcrypt for password hashing and jsonwebtoken for tokens.
// For now, implementing basic logic to port functionality.

export const signup = async (req, res) => {
    try {
        const { email, password, name } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const user = await User.create({
            email,
            passwordHash: hashedPassword,
            name
        });

        res.status(201).json({ user: { id: user.id, email: user.email, name: user.name } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Signup failed' });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
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

export const googleLogin = async (req, res) => {
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
