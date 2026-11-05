import express from 'express';

import controller from '../controllers/Plan';

import { Schemas, ValidateId, ValidateJoi, ValidatePlanList } from '../middleware/Joi';
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

/**
 * @openapi
 * /plans:
 *   post:
 *     tags: [Plans]
 *     summary: Crea un Plan sobre un Date (solo admin)
 *     description: >
 *       El Date tiene que existir (404) y no estar cerrado (409). Un Date solo tiene un Plan, también si el
 *       que tenía está archivado (409). Entre 1 y 3 tiradas, como mucho una aceptada; un Plan confirmado
 *       necesita su tirada aceptada (422).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/PlanInput' }
 *     responses:
 *       201: { $ref: '#/components/responses/PlanOne' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       409: { $ref: '#/components/responses/PlanConflict' }
 *       422: { $ref: '#/components/responses/Unprocessable' }
 */

// Ruta para crear un Plan
router.post('/', VerifyToken, RequireRole('admin'), ValidateJoi(Schemas.plan.create), controller.createPlan);

/**
 * @openapi
 * /plans/{planId}:
 *   put:
 *     tags: [Plans]
 *     summary: Edita el estado y las tiradas de un Plan (solo admin)
 *     description: El Date no se cambia. Un Plan archivado no se puede editar (409).
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema: { type: string, pattern: '^[0-9a-fA-F]{24}$' }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/PlanUpdateInput' }
 *     responses:
 *       200: { $ref: '#/components/responses/PlanOne' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       409: { $ref: '#/components/responses/PlanArchived' }
 *       422: { $ref: '#/components/responses/Unprocessable' }
 */

// Ruta para editar un Plan
router.put('/:planId', VerifyToken, RequireRole('admin'), ValidateId('planId'), ValidateJoi(Schemas.plan.update), controller.updatePlan);

/**
 * @openapi
 * /plans/{planId}/archive:
 *   post:
 *     tags: [Plans]
 *     summary: Archiva un Plan (borrado lógico, solo admin)
 *     description: El Plan no se elimina; se marca como archivado (deleted y deletedAt) y se puede restaurar.
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
 *       409: { $ref: '#/components/responses/PlanArchived' }
 */

// Ruta para archivar un Plan
router.post('/:planId/archive', VerifyToken, RequireRole('admin'), ValidateId('planId'), controller.archivePlan);

/**
 * @openapi
 * /plans/{planId}/restore:
 *   post:
 *     tags: [Plans]
 *     summary: Restaura un Plan archivado (solo admin)
 *     description: Solo se puede restaurar un Plan archivado (409 si no).
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
 *       409: { $ref: '#/components/responses/PlanNotArchived' }
 */

// Ruta para restaurar un Plan
router.post('/:planId/restore', VerifyToken, RequireRole('admin'), ValidateId('planId'), controller.restorePlan);

/**
 * @openapi
 * /plans/{planId}:
 *   delete:
 *     tags: [Plans]
 *     summary: Elimina un Plan para siempre (borrado físico, solo admin)
 *     description: Solo se puede eliminar un Plan archivado (409 si no).
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema: { type: string, pattern: '^[0-9a-fA-F]{24}$' }
 *     responses:
 *       204:
 *         description: Plan eliminado
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       409: { $ref: '#/components/responses/PlanNotArchived' }
 */

// Ruta para eliminar un Plan para siempre
router.delete('/:planId', VerifyToken, RequireRole('admin'), ValidateId('planId'), controller.deletePlan);

export = router;
