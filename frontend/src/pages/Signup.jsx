import React, { useState, useContext } from 'react';
import api from '../api';
import { AuthContext } from '../App';
import { Link } from 'react-router-dom';

const Signup = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useContext(AuthContext);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/auth/signup', { name, email, password });
            login(res.data.user);
        } catch (err) {
            setError(err.response?.data?.error || 'Signup failed');
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
                    <button className="w-full p-2 text-white bg-green-600 rounded hover:bg-green-700">
                        Sign Up
                    </button>
                </form>
                <p className="mt-4 text-sm text-center">
                    Already have an account? <Link to="/login" className="text-blue-500">Log in</Link>
                </p>
            </div>
        </div>
    );
};

export default Signup;
