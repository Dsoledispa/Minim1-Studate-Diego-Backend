import express from 'express';
import controller from '../controllers/Users';
import { VerifyToken } from '../middleware/VerifyToken';

// Agrupa las rutas relacionadas con los usuarios.
// De momento solo /me, que pide sesion (VerifyToken) pero no un rol concreto.
const router = express.Router();

/**
 * @openapi
 * /users/me:
 *   get:
 *     tags: [Users]
 *     summary: Devuelve el usuario con sesión
 *     description: El usuario se saca del token (req.user, que rellena VerifyToken), no de la URL.
 *     responses:
 *       200:
 *         description: El usuario con sesión
 *         content:
 *           application/json:
 *             example: { user: { _id: 6ab3f2fe9c500204a7d5f8a1, name: Admin, email: admin@example.com, role: admin } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */

// Devuelve el usuario con sesion a partir de req.user
router.get('/me', VerifyToken, controller.readMe);

export = router;
