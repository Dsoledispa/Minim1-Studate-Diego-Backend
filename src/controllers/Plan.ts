import { NextFunction, Request, Response } from 'express';
import type { PlanListQuery } from '../middleware/Joi';
import PlanService, { PlanError } from '../services/PlanService';

// Los Planes son del backoffice: todas las rutas pasan antes por VerifyToken y RequireRole('admin')

// Función para obtener una pagina de Planes
const readAll = async (req: Request, res: Response<unknown, { query: PlanListQuery }>, next: NextFunction) => {
    try {
        // ValidatePlanList ya ha comprobado y convertido los filtros de la URL
        const result = await PlanService.getPlans(res.locals.query);

        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

// Función para buscar un Plan concreto usando su ID
const readPlan = async (req: Request<{ planId: string }>, res: Response, next: NextFunction) => {
    try {
        const plan = await PlanService.getPlanById(req.params.planId);

        if (plan) {
            res.status(200).json({ plan });
        } else {
            res.status(404).json({ message: 'not found' });
        }
    } catch (error) {
        next(error);
    }
};

// El codigo y el mensaje de cada error del service
const ERRORS: Record<PlanError, [number, string]> = {
    'not-found': [404, 'not found'],
    'date-not-found': [404, 'El Date no existe'],
    'date-closed': [409, 'El Date está cerrado: ya no se le puede hacer un Plan'],
    'already-exists': [409, 'Este Date ya tiene un Plan'],
    archived: [409, 'El Plan está archivado: restáuralo antes de editarlo'],
    'already-archived': [409, 'El Plan ya está archivado'],
    'not-archived': [409, 'El Plan no está archivado']
};

const sendError = (res: Response, error: PlanError) => {
    const [status, message] = ERRORS[error];
    res.status(status).json({ message });
};

// Función para crear un Plan (el body ya lo ha validado Joi)
const createPlan = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await PlanService.createPlan(req.body);

        if ('plan' in result) {
            res.status(201).json({ plan: result.plan });
        } else {
            sendError(res, result.error);
        }
    } catch (error) {
        next(error);
    }
};

// Función para editar el estado y las tiradas de un Plan
const updatePlan = async (req: Request<{ planId: string }>, res: Response, next: NextFunction) => {
    try {
        const result = await PlanService.updatePlan(req.params.planId, req.body);

        if ('plan' in result) {
            res.status(200).json({ plan: result.plan });
        } else {
            sendError(res, result.error);
        }
    } catch (error) {
        next(error);
    }
};

// Función para archivar un Plan (borrado logico)
const archivePlan = async (req: Request<{ planId: string }>, res: Response, next: NextFunction) => {
    try {
        const result = await PlanService.archivePlan(req.params.planId);

        if ('plan' in result) {
            res.status(200).json({ plan: result.plan });
        } else {
            sendError(res, result.error);
        }
    } catch (error) {
        next(error);
    }
};

// Función para restaurar un Plan archivado
const restorePlan = async (req: Request<{ planId: string }>, res: Response, next: NextFunction) => {
    try {
        const result = await PlanService.restorePlan(req.params.planId);

        if ('plan' in result) {
            res.status(200).json({ plan: result.plan });
        } else {
            sendError(res, result.error);
        }
    } catch (error) {
        next(error);
    }
};

// Función para eliminar un Plan para siempre (borrado fisico, solo si esta archivado)
const deletePlan = async (req: Request<{ planId: string }>, res: Response, next: NextFunction) => {
    try {
        const result = await PlanService.deletePlan(req.params.planId);

        if (result === 'deleted') {
            res.status(204).send();
        } else if (result === 'not-archived') {
            // El mismo mensaje que con los usuarios: primero se archiva
            res.status(409).json({ message: 'Archiva el Plan antes de eliminarlo' });
        } else {
            sendError(res, result);
        }
    } catch (error) {
        next(error);
    }
};

export default { readAll, readPlan, createPlan, updatePlan, archivePlan, restorePlan, deletePlan };
