import express from 'express';

import controller from '../controllers/Plan';

import { ValidateId, ValidatePlanList } from '../middleware/Joi';
import { RequireRole } from '../middleware/RequireRole';
import { VerifyToken } from '../middleware/VerifyToken';

// Rutas de los Planes (el "Cambio de Aula"). Todas son del backoffice: cada una pasa primero por
// VerifyToken (401 si no hay un token valido) y despues por RequireRole('admin') (403 si no es admin).
const router = express.Router();

/**
 * @openapi
 * /plans:
 *   get:
 *     tags: [Plans]
 *     summary: Lista los Planes (solo admin)
 *     description: >
 *       Paginación de servidor, primero los más nuevos. Cada Plan trae su Date y los dos usuarios (populate).
 *       Los filtros se pueden combinar: search (texto en el sitio de las tiradas), status, date y archived.
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 5 }
 *       - in: query
 *         name: search
 *         schema: { type: string, maxLength: 100 }
 *         description: Texto que se busca en el sitio de las tiradas (sin distinguir mayúsculas)
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [proposing, confirmed, cancelled] }
 *         description: Solo los de este estado
 *       - in: query
 *         name: date
 *         schema: { type: string, pattern: '^[0-9a-fA-F]{24}$' }
 *         description: Solo el Plan de este Date
 *       - in: query
 *         name: archived
 *         schema: { type: boolean, default: false }
 *         description: Con true, solo los archivados
 *     responses:
 *       200: { $ref: '#/components/responses/PlanList' }
 *       400: { $ref: '#/components/responses/InvalidPagination' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       500: { $ref: '#/components/responses/ServerError' }
 */

// Ruta para obtener una pagina de Planes
router.get('/', VerifyToken, RequireRole('admin'), ValidatePlanList, controller.readAll);

/**
 * @openapi
 * /plans/{planId}:
 *   get:
 *     tags: [Plans]
 *     summary: Devuelve un Plan (solo admin)
 *     description: También si está archivado.
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema: { type: string, pattern: '^[0-9a-fA-F]{24}$' }
 *     responses:
 *       200: { $ref: '#/components/responses/PlanOne' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */

// Ruta para buscar un Plan usando su ID
router.get('/:planId', VerifyToken, RequireRole('admin'), ValidateId('planId'), controller.readPlan);

export = router;
