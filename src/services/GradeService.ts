import Grade, { GradeValue, IGrade } from '../models/Grade';
import User from '../models/User';
import type { GradeListQuery } from '../middleware/Joi';

// Al devolver un voto, cambiamos el id de from y to por los datos del usuario (populate).
// Ojo con el prehook de User: populate tambien hace una consulta a User, y sin withInactive un
// usuario inactivo o archivado saldria como null. El admin tiene que ver de quien es cada voto.
const POPULATE_USERS = [
    { path: 'from', select: 'name email photo', options: { withInactive: true } },
    { path: 'to', select: 'name email photo', options: { withInactive: true } }
];

// Funcion que busca una pagina de votos, primero los mas nuevos
export const getGrades = async ({ page, limit, value, user }: GradeListQuery) => {
    // user filtra los votos en los que ese usuario es el que vota o el que recibe el voto
    const filter = {
        ...(value ? { value } : {}),
        ...(user ? { $or: [{ from: user }, { to: user }] } : {})
    };

    const [grades, total] = await Promise.all([
        Grade.find(filter)
            .populate(POPULATE_USERS)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit),
        Grade.countDocuments(filter)
    ]);

    return {
        grades,
        total,
        page,
        pages: Math.ceil(total / limit)
    };
};

// Funcion que busca un voto por su id, con los datos de los dos usuarios
export const getGradeById = (gradeId: string) => {
    return Grade.findById(gradeId).populate(POPULATE_USERS);
};

// Funcion que crea un voto. Antes comprueba que no es un voto a uno mismo y que los dos usuarios existen
// (aunque esten inactivos: el admin puede cargar votos de cualquiera).
// Devuelve { error } si algo falla, para que el controlador elija el codigo, o { grade } si se ha creado.
// Si la pareja ya tenia voto, MongoDB lanza un error 11000 y el ErrorHandler responde 409.
export const createGrade = async (data: IGrade) => {
    if (String(data.from) === String(data.to)) {
        return { error: 'same-user' };
    }

    const [from, to] = await Promise.all([
        User.findById(data.from).setOptions({ withInactive: true }),
        User.findById(data.to).setOptions({ withInactive: true })
    ]);

    if (!from) {
        return { error: 'from-not-found' };
    }

    if (!to) {
        return { error: 'to-not-found' };
    }

    const created = await Grade.create(data);

    return { grade: await getGradeById(String(created._id)) };
};

// Funcion que cambia la nota de un voto (de A+ a F o al reves).
// Con new: true devolvemos el voto ya cambiado
export const updateGrade = (gradeId: string, value: GradeValue) => {
    return Grade.findByIdAndUpdate(gradeId, { value }, { new: true }).populate(POPULATE_USERS);
};

// Funcion que elimina un voto. Es un borrado fisico: un voto no se archiva, o existe o no existe
export const deleteGrade = (gradeId: string) => {
    return Grade.findByIdAndDelete(gradeId);
};

export default { getGrades, getGradeById, createGrade, updateGrade, deleteGrade };
