import path from 'node:path';
import swaggerJsdoc from 'swagger-jsdoc';
import j2s from 'joi-to-swagger';
import { Schemas } from '../middleware/Joi';
import { config } from './config';

// La documentación de cada endpoint está escrita en un comentario /** @openapi */
// encima de su ruta, en src/routes/. Aquí solo se montan las piezas comunes.

// Los esquemas del body salen de los mismos esquemas de Joi que validan las
// peticiones, así que no se pueden quedar desfasados.
const { swagger: registerInput } = j2s(Schemas.auth.register);
const { swagger: loginInput } = j2s(Schemas.auth.login);

// Lo que devuelve la API no es igual a lo que se envía: lleva el _id y las fechas que
// pone MongoDB, y el usuario nunca devuelve la contraseña.
const storedFields = {
    _id: { type: 'string', example: '6ab3f2fe9c500204a7d5f80b' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' }
};

const { password: _password, ...userFields } = registerInput.properties;

const userSchema = {
    type: 'object',
    properties: { ...storedFields, ...userFields, role: { type: 'string', enum: ['user', 'admin'] } }
};

// Una respuesta correcta: el esquema de lo que se devuelve y un ejemplo con datos de verdad
const okResponse = (description: string, schema: object, example: object) => ({
    description,
    content: { 'application/json': { schema, example } }
});

// Una respuesta de error: siempre un message, con un ejemplo del mensaje real
const errorResponse = (description: string, message: string) => ({
    description,
    content: {
        'application/json': {
            schema: {
                type: 'object',
                properties: { message: { type: 'string' } }
            },
            example: { message }
        }
    }
});

const userExample = {
    _id: '6ab3f2fe9c500204a7d5f8a1',
    name: 'Admin',
    email: 'admin@example.com',
    role: 'admin',
    createdAt: '2026-10-05T10:00:00.000Z',
    updatedAt: '2026-10-05T10:00:00.000Z'
};

const swaggerPath = (filePath: string) => filePath.replace(/\\/g, '/');

const swaggerDocument = swaggerJsdoc({
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Studate API',
            version: '1.0.0',
            description: 'API de Studate, proyecto del Grupo 3 de EA (Node.js, Express, TypeScript y MongoDB).'
        },
        servers: [{ url: `http://localhost:${config.server.port}` }],
        tags: [
            { name: 'Health', description: 'Comprobar que la API responde' },
            { name: 'Auth', description: 'Registro, login, renovación del token y logout' },
            { name: 'Users', description: 'Usuarios' }
        ],
        // Por defecto todas las rutas piden el token (el candado de Swagger).
        // Las rutas públicas lo quitan con security: [] en su comentario @openapi.
        security: [{ bearerAuth: [] }],
        components: {
            // Cómo se envía el token: en la cabecera Authorization: Bearer <token>.
            // En la página de Swagger se pega con el botón Authorize.
            securitySchemes: {
                bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
                // El refresh token va en una cookie HttpOnly que deja el login; la usan /auth/refresh y /auth/logout.
                // Desde la propia página de Swagger funciona sola, porque el navegador la envía.
                refreshCookie: { type: 'apiKey', in: 'cookie', name: 'refreshToken' }
            },
            schemas: {
                RegisterInput: registerInput,
                LoginInput: loginInput,
                User: userSchema
            },
            responses: {
                LoginOk: okResponse(
                    'Sesión iniciada: el access token y el usuario (el refresh token va en la cookie)',
                    {
                        type: 'object',
                        properties: {
                            token: { type: 'string' },
                            user: userSchema
                        }
                    },
                    { token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', user: userExample }
                ),
                BadCredentials: errorResponse('El email o la contraseña no son correctos', 'Email o contraseña incorrectos'),
                Unauthorized: errorResponse('Falta el token, ha caducado o no es válido', 'El token ha caducado'),
                Forbidden: errorResponse('El usuario no tiene el rol necesario', 'Necesitas el rol admin'),
                BadRequest: errorResponse('El id de la URL no tiene forma de id de MongoDB', 'userId no es un id válido'),
                InvalidPagination: errorResponse('Los parámetros de paginación o búsqueda no son válidos', '"page" must be greater than or equal to 1'),
                NotFound: errorResponse('No existe ningún recurso con ese id', 'not found'),
                Conflict: errorResponse('Ya existe otro recurso con ese email', 'email ya existe'),
                Unprocessable: errorResponse('El body no cumple el esquema', '"email" is required'),
                ServerError: errorResponse('Error inesperado del servidor', 'Internal server error')
            }
        }
    },
    // __dirname es src/config con npm run dev y build/config con npm start:
    // en los dos casos se leen las rutas, porque al compilar se conservan los comentarios
    apis: [
        swaggerPath(path.join(__dirname, '../routes/*.ts')),
        swaggerPath(path.join(__dirname, '../routes/*.js')),
        swaggerPath(path.join(__dirname, '../server.ts')),
        swaggerPath(path.join(__dirname, '../server.js'))
    ]
});

export default swaggerDocument;
