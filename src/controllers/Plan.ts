import { NextFunction, Request, Response } from 'express';
import type { PlanListQuery } from '../middleware/Joi';
import PlanService from '../services/PlanService';

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

export default { readAll, readPlan };
