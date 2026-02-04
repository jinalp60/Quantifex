import React, { useState, useContext } from 'react';
import api from '../api';
import { AuthContext } from '../App';
import { Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';

const Signup = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const { login } = useContext(AuthContext);
    const [error, setError] = useState('');

    const validateEmail = (email) => {
        return String(email)
            .toLowerCase()
            .match(
                /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
            );
    };

    const validatePassword = (password) => {
        // at least one uppercase, one lowercase, one numeric, one special character, min 8 chars
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return regex.test(password);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!validateEmail(email)) {
            setError('email is not valid');
            return;
        }

        if (!validatePassword(password)) {
            setError('Password must be at least 8 characters long and include: one uppercase, one lowercase, one numeric, and one special character.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        try {
            const res = await api.post('/auth/signup', { name, email, password });
            login(res.data.user);
        } catch (err) {
            setError(err.response?.data?.error || 'Signup failed');
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            const res = await api.post('/auth/google', { idToken: credentialResponse.credential });
            login(res.data.user);
        } catch (err) {
            setError(err.response?.data?.error || 'Google Login failed');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="p-8 bg-white rounded shadow-md w-96">
                <h2 className="mb-4 text-2xl font-bold text-center">Create Account</h2>
                {error && <p className="mb-4 text-red-500 text-sm">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        className="w-full p-2 border rounded"
                        placeholder="Name"
                        value={name}
                        onChange={e => setName(e.target.value)}
                    />
                    <input
                        className="w-full p-2 border rounded"
                        placeholder="Email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                    />
                    <input
                        className="w-full p-2 border rounded"
                        placeholder="Password"
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                    />
                    <input
                        className="w-full p-2 border rounded"
                        placeholder="Retype Password"
                        type="password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                    />
                    <button className="w-full p-2 text-white bg-green-600 rounded hover:bg-green-700">
                        Sign Up
                    </button>
                </form>

                <div className="mt-4 flex flex-col items-center space-y-4">
                    <div className="w-full flex items-center">
                        <div className="flex-grow border-t border-gray-300"></div>
                        <span className="flex-shrink mx-4 text-gray-400 text-sm">Or</span>
                        <div className="flex-grow border-t border-gray-300"></div>
                    </div>

                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => setError('Google Login Failed')}
                    />
                </div>
                <p className="mt-4 text-sm text-center">
                    Already have an account? <Link to="/login" className="text-blue-500">Log in</Link>
                </p>
            </div>
        </div>
    );
};

export default Signup;
