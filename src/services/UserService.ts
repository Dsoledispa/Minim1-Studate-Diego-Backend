import User, { IUser, UserRole } from '../models/User';
import type { UserListQuery } from '../middleware/Joi';
import { escapeRegExp } from '../utils/escape-regexp';

// Los datos del usuario con sesion, para GET /users/me. Nunca lleva la contraseña.
export interface IUserProfile {
    _id: string;
    name: string;
    email: string;
    role: UserRole;
}

// Opcion para saltarse el prehook de "está activo" del modelo User.
// Las funciones del backoffice la usan porque el admin tiene que ver a todos los usuarios,
// tambien a los inactivos y a los archivados (si no, no podria reactivarlos ni restaurarlos).
const ALL_USERS = { withInactive: true };

// Funcion que busca un usuario por su id. Devuelve null si no existe.
// Es la de GET /users/me: aqui SI se aplica el prehook, asi que un usuario inactivo no se encuentra.
export const getUserById = async (userId: string): Promise<IUserProfile | null> => {
    const user = await User.findById(userId);

    if (!user) {
        return null;
    }

    const profile: IUserProfile = {
        _id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role
    };

    return profile;
};

// ---- Gestion de usuarios del backoffice (solo admin) ----

// Funcion que busca una pagina de usuarios con los filtros del backoffice
export const getUsers = async ({ page, limit, search, role, active, archived }: UserListQuery) => {
    const searchRegex = search ? new RegExp(escapeRegExp(search), 'i') : undefined;

    // archived decide si se listan los archivados o los que no lo estan (deleted es el campo del modelo).
    // role y active solo se añaden al filtro si vienen en la URL
    const filter = {
        deleted: archived,
        ...(role ? { role } : {}),
        ...(active !== undefined ? { active } : {}),
        ...(searchRegex ? { $or: [{ name: searchRegex }, { email: searchRegex }] } : {})
    };

    const [users, total] = await Promise.all([
        User.find(filter)
            .setOptions(ALL_USERS)
            .sort({ name: 1 })
            .skip((page - 1) * limit)
            .limit(limit),
        User.countDocuments(filter).setOptions(ALL_USERS)
    ]);

    return {
        users,
        total,
        page,
        pages: Math.ceil(total / limit)
    };
};

// Funcion que busca un usuario por su id para el backoffice: lo encuentra aunque este inactivo o archivado
export const getUserForAdmin = (userId: string) => {
    return User.findById(userId).setOptions(ALL_USERS);
};

// Funcion que crea un usuario desde el backoffice.
// Con create() se ejecuta el hook pre-save, que cifra la contraseña.
// Si el email ya existe, MongoDB lanza un error 11000 y el ErrorHandler responde 409.
export const createUser = (data: IUser) => {
    return User.create(data);
};

// Funcion que actualiza un usuario.
// Filtramos deleted: false para que un usuario archivado no se pueda editar (devolvera null y el
// controlador respondera 404): primero hay que restaurarlo.
// Con new: true devolvemos el documento ya actualizado.
export const updateUser = (userId: string, data: Partial<IUser>) => {
    return User.findOneAndUpdate({ _id: userId, deleted: false }, data, { new: true }).setOptions(ALL_USERS);
};

export default { getUserById, getUsers, getUserForAdmin, createUser, updateUser };
