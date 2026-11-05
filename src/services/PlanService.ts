import type { PlanListQuery } from '../middleware/Joi';
import Plan from '../models/Plan';
import { escapeRegExp } from '../utils/escape-regexp';

// Populate anidado: el Plan trae su Date y, dentro del Date, los dos usuarios con su nombre, email y
// foto. Asi el backoffice ve de quien es el Plan sin hacer mas peticiones. Los usuarios llevan
// withInactive (como en Dates y votos): sin el, el prehook de User dejaria en null a los inactivos
const POPULATE_DATE = {
    path: 'date',
    select: 'users status expiresAt',
    populate: { path: 'users', select: 'name email photo', options: { withInactive: true } }
};

// Funcion que busca una pagina de Planes, primero los mas nuevos.
// Todos los filtros se pueden combinar en la misma peticion:
//   search    texto que se busca en el sitio de cualquiera de las tiradas (spins.place)
//   status    solo los de un estado
//   date      solo el Plan de ese Date
//   archived  los archivados (true) o los que no lo estan (false, por defecto)
export const getPlans = async ({ page, limit, search, status, date, archived }: PlanListQuery) => {
    const filter = {
        deleted: archived,
        // 'spins.place' busca dentro del vector: basta con que una tirada coincida.
        // escapeRegExp evita que un texto como "c++" se interprete como una expresion regular
        ...(search ? { 'spins.place': new RegExp(escapeRegExp(search), 'i') } : {}),
        ...(status ? { status } : {}),
        ...(date ? { date } : {})
    };

    // La pagina y el total se piden a la vez; el total usa el mismo filtro para que las paginas cuadren
    const [plans, total] = await Promise.all([
        Plan.find(filter)
            .populate(POPULATE_DATE)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit),
        Plan.countDocuments(filter)
    ]);

    return {
        plans,
        total,
        page,
        pages: Math.ceil(total / limit)
    };
};

// Funcion que busca un Plan por su id, tambien si esta archivado (el admin tiene que poder verlo
// para restaurarlo)
export const getPlanById = (planId: string) => {
    return Plan.findById(planId).populate(POPULATE_DATE);
};

export default { getPlans, getPlanById };
