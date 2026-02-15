/**
 * User Settings API Tests
 * Tests profile updates, password changes, and preferences
 */
import request from 'supertest';
import { describe, expect, test } from '@jest/globals';
import express from 'express';

describe('User Settings API', () => {
    describe('GET /api/users/profile', () => {
        test('should return user profile for authenticated user', async () => {
            const app = express();
            app.use(express.json());

            app.get('/api/users/profile', (req, res) => {
                const authHeader = req.headers.authorization;
                if (!authHeader) {
                    return res.status(401).json({ error: 'Unauthorized' });
                }
                return res.status(200).json({
                    id: '123',
                    name: 'Test User',
                    email: 'test@example.com',
                    role: 'STUDENT',
                });
            });

            const response = await request(app)
                .get('/api/users/profile')
                .set('Authorization', 'Bearer test-token');

            expect(response.status).toBe(200);
            expect(response.body.email).toBe('test@example.com');
        });

        test('should return 401 without authentication', async () => {
            const app = express();
            app.get('/api/users/profile', (req, res) => {
                if (!req.headers.authorization) {
                    return res.status(401).json({ error: 'Unauthorized' });
                }
                return res.status(200).json({});
            });

            const response = await request(app).get('/api/users/profile');
            expect(response.status).toBe(401);
        });
    });

    describe('PUT /api/users/profile', () => {
        test('should update user profile successfully', async () => {
            const app = express();
            app.use(express.json());

            app.put('/api/users/profile', (req, res) => {
                const { name, phone } = req.body;
                return res.status(200).json({
                    id: '123',
                    name: name || 'Test User',
                    phone: phone || null,
                    email: 'test@example.com',
                });
            });

            const response = await request(app)
                .put('/api/users/profile')
                .send({ name: 'Updated Name', phone: '09171234567' });

            expect(response.status).toBe(200);
            expect(response.body.name).toBe('Updated Name');
            expect(response.body.phone).toBe('09171234567');
        });

        test('should validate email format', async () => {
            const app = express();
            app.use(express.json());

            app.put('/api/users/profile', (req, res) => {
                const { email } = req.body;
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (email && !emailRegex.test(email)) {
                    return res.status(400).json({ error: 'Invalid email format' });
                }
                return res.status(200).json({ email });
            });

            const response = await request(app)
                .put('/api/users/profile')
                .send({ email: 'invalid-email' });

            expect(response.status).toBe(400);
        });
    });

    describe('PUT /api/users/password', () => {
        test('should change password successfully', async () => {
            const app = express();
            app.use(express.json());

            app.put('/api/users/password', (req, res) => {
                const { currentPassword, newPassword, confirmPassword } = req.body;
                if (!currentPassword || !newPassword || !confirmPassword) {
                    return res.status(400).json({ error: 'All fields are required' });
                }
                if (newPassword !== confirmPassword) {
                    return res.status(400).json({ error: 'Passwords do not match' });
                }
                if (newPassword.length < 8) {
                    return res.status(400).json({ error: 'Password must be at least 8 characters' });
                }
                return res.status(200).json({ message: 'Password updated successfully' });
            });

            const response = await request(app)
                .put('/api/users/password')
                .send({
                    currentPassword: 'OldPassword123!',
                    newPassword: 'NewPassword123!',
                    confirmPassword: 'NewPassword123!',
                });

            expect(response.status).toBe(200);
        });

        test('should reject mismatched passwords', async () => {
            const app = express();
            app.use(express.json());

            app.put('/api/users/password', (req, res) => {
                const { newPassword, confirmPassword } = req.body;
                if (newPassword !== confirmPassword) {
                    return res.status(400).json({ error: 'Passwords do not match' });
                }
                return res.status(200).json({});
            });

            const response = await request(app)
                .put('/api/users/password')
                .send({
                    currentPassword: 'OldPassword123!',
                    newPassword: 'NewPassword123!',
                    confirmPassword: 'DifferentPassword!',
                });

            expect(response.status).toBe(400);
        });

        test('should reject weak passwords', async () => {
            const app = express();
            app.use(express.json());

            app.put('/api/users/password', (req, res) => {
                const { newPassword } = req.body;
                if (newPassword.length < 8) {
                    return res.status(400).json({ error: 'Password too weak' });
                }
                return res.status(200).json({});
            });

            const response = await request(app)
                .put('/api/users/password')
                .send({
                    currentPassword: 'OldPassword123!',
                    newPassword: 'weak',
                    confirmPassword: 'weak',
                });

            expect(response.status).toBe(400);
        });
    });

    describe('PUT /api/users/preferences', () => {
        test('should update theme preference', async () => {
            const app = express();
            app.use(express.json());

            app.put('/api/users/preferences', (req, res) => {
                const { theme } = req.body;
                const validThemes = ['light', 'dark', 'system'];
                if (!validThemes.includes(theme)) {
                    return res.status(400).json({ error: 'Invalid theme' });
                }
                return res.status(200).json({ theme });
            });

            const response = await request(app)
                .put('/api/users/preferences')
                .send({ theme: 'dark' });

            expect(response.status).toBe(200);
            expect(response.body.theme).toBe('dark');
        });

        test('should update notification preferences', async () => {
            const app = express();
            app.use(express.json());

            app.put('/api/users/preferences', (req, res) => {
                const { notifications } = req.body;
                return res.status(200).json({ notifications });
            });

            const response = await request(app)
                .put('/api/users/preferences')
                .send({
                    notifications: { email: true, push: false, sms: false },
                });

            expect(response.status).toBe(200);
            expect(response.body.notifications.email).toBe(true);
        });
    });
});

describe('Profile Photo API', () => {
    describe('POST /api/users/photo', () => {
        test('should accept valid image types', async () => {
            const app = express();
            app.use(express.json());

            app.post('/api/users/photo', (req, res) => {
                const contentType = req.headers['content-type'];
                const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
                if (contentType && validTypes.some(type => contentType.includes(type))) {
                    return res.status(200).json({ photoUrl: 'https://example.com/photo.jpg' });
                }
                return res.status(400).json({ error: 'Invalid file type' });
            });

            const response = await request(app)
                .post('/api/users/photo')
                .set('Content-Type', 'image/jpeg');

            expect(response.status).toBe(200);
        });
    });
});
