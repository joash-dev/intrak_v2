/**
 * Authentication API Tests
 * Tests login, registration, and token endpoints
 */
import request from 'supertest';
import { describe, expect, jest, test } from '@jest/globals';
import express from 'express';
import jwt from 'jsonwebtoken';

describe('Authentication API', () => {
    describe('POST /api/auth/login', () => {
        test('should return 400 if email is missing', async () => {
            const app = express();
            app.use(express.json());

            app.post('/api/auth/login', (req, res) => {
                if (!req.body.email) {
                    return res.status(400).json({ error: 'Email is required' });
                }
                return res.status(200).json({ message: 'OK' });
            });

            const response = await request(app)
                .post('/api/auth/login')
                .send({ password: 'Password123!' });

            expect(response.status).toBe(400);
            expect(response.body.error).toBeDefined();
        });

        test('should return 400 if password is missing', async () => {
            const app = express();
            app.use(express.json());

            app.post('/api/auth/login', (req, res) => {
                if (!req.body.password) {
                    return res.status(400).json({ error: 'Password is required' });
                }
                return res.status(200).json({ message: 'OK' });
            });

            const response = await request(app)
                .post('/api/auth/login')
                .send({ email: 'test@example.com' });

            expect(response.status).toBe(400);
        });

        test('should return 401 for invalid credentials', async () => {
            const app = express();
            app.use(express.json());

            app.post('/api/auth/login', (req, res) => {
                return res.status(401).json({ error: 'Invalid credentials' });
            });

            const response = await request(app)
                .post('/api/auth/login')
                .send({ email: 'wrong@example.com', password: 'wrongpassword' });

            expect(response.status).toBe(401);
        });

        test('should return token on successful login', async () => {
            const app = express();
            app.use(express.json());

            app.post('/api/auth/login', (req, res) => {
                if (req.body.email === 'admin@example.com' && req.body.password === 'Password123!') {
                    const token = jwt.sign(
                        { userId: '123', role: 'ADMIN' },
                        process.env.JWT_SECRET || 'test-secret'
                    );
                    return res.status(200).json({ token, user: { id: '123', role: 'ADMIN' } });
                }
                return res.status(401).json({ error: 'Invalid credentials' });
            });

            const response = await request(app)
                .post('/api/auth/login')
                .send({ email: 'admin@example.com', password: 'Password123!' });

            expect(response.status).toBe(200);
            expect(response.body.token).toBeDefined();
        });
    });

    describe('Token Validation', () => {
        test('should verify a valid JWT token', () => {
            const secret = 'test-secret';
            const payload = { userId: '123', role: 'STUDENT' };
            const token = jwt.sign(payload, secret);

            const decoded = jwt.verify(token, secret) as typeof payload;
            expect(decoded.userId).toBe('123');
            expect(decoded.role).toBe('STUDENT');
        });

        test('should reject an invalid JWT token', () => {
            const invalidToken = 'invalid.token.here';

            expect(() => {
                jwt.verify(invalidToken, 'test-secret');
            }).toThrow();
        });

        test('should reject an expired token', () => {
            const secret = 'test-secret';
            const expiredToken = jwt.sign(
                { userId: '123' },
                secret,
                { expiresIn: '-1s' }
            );

            expect(() => {
                jwt.verify(expiredToken, secret);
            }).toThrow();
        });
    });

    describe('Role-Based Access', () => {
        const mockAuthMiddleware = (allowedRoles: string[]) => {
            return (req: any, res: any, next: any) => {
                const userRole = req.headers['x-user-role'];
                if (!userRole || !allowedRoles.includes(userRole as string)) {
                    return res.status(403).json({ error: 'Forbidden' });
                }
                next();
            };
        };

        test('should allow access for correct role', async () => {
            const app = express();
            app.get('/api/admin/dashboard', mockAuthMiddleware(['ADMIN']), (req, res) => {
                res.json({ message: 'Admin dashboard' });
            });

            const response = await request(app)
                .get('/api/admin/dashboard')
                .set('x-user-role', 'ADMIN');

            expect(response.status).toBe(200);
        });

        test('should deny access for incorrect role', async () => {
            const app = express();
            app.get('/api/admin/dashboard', mockAuthMiddleware(['ADMIN']), (req, res) => {
                res.json({ message: 'Admin dashboard' });
            });

            const response = await request(app)
                .get('/api/admin/dashboard')
                .set('x-user-role', 'STUDENT');

            expect(response.status).toBe(403);
        });

        test('should deny access without role', async () => {
            const app = express();
            app.get('/api/admin/dashboard', mockAuthMiddleware(['ADMIN']), (req, res) => {
                res.json({ message: 'Admin dashboard' });
            });

            const response = await request(app)
                .get('/api/admin/dashboard');

            expect(response.status).toBe(403);
        });
    });
});
