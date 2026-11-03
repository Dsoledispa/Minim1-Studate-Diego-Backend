import User, { UserRole } from '../models/User';

// Los datos del usuario con sesion, para GET /users/me. Nunca lleva la contraseña.
export interface IUserProfile {
    _id: string;
    name: string;
    email: string;
    role: UserRole;
}

// Funcion que busca un usuario por su id. Devuelve null si no existe.
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

export default { getUserById };
