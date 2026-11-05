import type { PlanListQuery } from '../middleware/Joi';
import DateModel from '../models/Date';
import Plan, { ISpin, PlanStatus } from '../models/Plan';
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

// ---- Escritura (crear, editar, archivar, restaurar y eliminar) ----

// Lo que llega en el body (ya validado por Joi)
export interface PlanInput {
    date: string;
    status?: PlanStatus;
    spins: ISpin[];
}

// Los motivos por los que una operacion no se puede hacer. El service no sabe de HTTP: devuelve
// { error } y el controlador elige el codigo (404 o 409), como en DateService
export type PlanError = 'not-found' | 'date-not-found' | 'date-closed' | 'already-exists' | 'archived' | 'already-archived' | 'not-archived';

type PlanResult = { plan: NonNullable<Awaited<ReturnType<typeof getPlanById>>> } | { error: PlanError };

// Funcion que crea un Plan sobre un Date.
//   - el Date tiene que existir (404) y no estar cerrado (409): un Date cerrado ya no se planea
//   - un Date solo tiene un Plan, tambien si el que tenia esta archivado (409). Si dos peticiones
//     llegan a la vez, el indice unico de date frena la segunda (error 11000, que tambien es 409)
export const createPlan = async ({ date, status, spins }: PlanInput): Promise<PlanResult> => {
    const pairDate = await DateModel.findById(date);

    if (!pairDate) {
        return { error: 'date-not-found' };
    }

    if (pairDate.status === 'closed') {
        return { error: 'date-closed' };
    }

    if (await Plan.exists({ date })) {
        return { error: 'already-exists' };
    }

    const created = await Plan.create({ date, status, spins });

    return { plan: await created.populate(POPULATE_DATE) };
};

// Funcion que edita el estado y las tiradas de un Plan. Un Plan archivado no se edita (409): primero
// hay que restaurarlo. Se usa save() y no findOneAndUpdate para que pasen los validadores del modelo
export const updatePlan = async (planId: string, { status, spins }: Omit<PlanInput, 'date'>): Promise<PlanResult> => {
    const plan = await Plan.findById(planId);

    if (!plan) {
        return { error: 'not-found' };
    }

    if (plan.deleted) {
        return { error: 'archived' };
    }

    plan.set({ status, spins });
    await plan.save();

    return { plan: await plan.populate(POPULATE_DATE) };
};

// Funcion que archiva un Plan (borrado logico): se marca deleted y se guarda la fecha
export const archivePlan = async (planId: string): Promise<PlanResult> => {
    const plan = await Plan.findById(planId);

    if (!plan) {
        return { error: 'not-found' };
    }

    if (plan.deleted) {
        return { error: 'already-archived' };
    }

    plan.set({ deleted: true, deletedAt: new Date() });
    await plan.save();

    return { plan: await plan.populate(POPULATE_DATE) };
};

// Funcion que restaura un Plan archivado: deleted vuelve a false y se quita deletedAt
export const restorePlan = async (planId: string): Promise<PlanResult> => {
    const plan = await Plan.findById(planId);

    if (!plan) {
        return { error: 'not-found' };
    }

    if (!plan.deleted) {
        return { error: 'not-archived' };
    }

    plan.set({ deleted: false, deletedAt: undefined });
    await plan.save();

    return { plan: await plan.populate(POPULATE_DATE) };
};

// Funcion que elimina un Plan para siempre (borrado fisico). Como con los usuarios, solo se puede
// si antes esta archivado (409): asi nadie borra un Plan en uso por error
export const deletePlan = async (planId: string): Promise<'deleted' | PlanError> => {
    const plan = await Plan.findById(planId);

    if (!plan) {
        return 'not-found';
    }

    if (!plan.deleted) {
        return 'not-archived';
    }

    await plan.deleteOne();

    return 'deleted';
};

export default { getPlans, getPlanById, createPlan, updatePlan, archivePlan, restorePlan, deletePlan };
