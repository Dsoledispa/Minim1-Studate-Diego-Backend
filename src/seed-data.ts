import { IUser } from './models/User';

// Datos de ejemplo para llenar la base de datos.
// Los nombres y los correos son inventados.

// Usuarios para iniciar sesión en la aplicación: uno de cada rol.
// Las contraseñas están sin cifrar y son públicas a propósito (ver el README):
// el hook pre-save del modelo User las cifra al guardarlas.
export const usersSeed: IUser[] = [
    {
        name: 'Admin',
        email: 'admin@example.com',
        password: 'seminari7',
        role: 'admin'
    },
    {
        name: 'Usuario',
        email: 'user@example.com',
        password: 'seminari7',
        role: 'user'
    }
];
