# LOGS

Bitácora del backend de Studate. Tiene dos partes:

- **Tareas**: lo que hay que hacer en este repositorio en el sprint, agrupado por ramas. Quien cierra una tarea la marca.
- **Bitácora**: lo que se ha hecho, las decisiones tomadas y qué prompts de IA se han usado.

Las tareas del frontend están en el LOGS.md de [STUDATE---FRONTEND](https://github.com/mariacazorla/STUDATE---FRONTEND).
El tablero del sprint, con las horas, es el [GitHub Project de Studate](https://github.com/users/mariacazorla/projects/2).

## Contrato

Lo que backend y frontend tienen que cumplir igual. Si algo de aquí cambia, se cambia en los dos LOGS.md.

- **Rutas públicas**: `POST /auth/register` y `POST /auth/login`. `POST /auth/refresh` y `POST /auth/logout` se autentican con la cookie del refresh token. `GET /ping` y la documentación
  (`/api-docs`) también son públicas. Todo lo demás exige token.
- **Registro**: el cuerpo es `{ name, email, password }` (contraseña de 8 caracteres como mínimo; `role` no se acepta, todo usuario nuevo es `user`). Responde 201 con `{ user }` y **sin token**, 409
  si el email ya existe o 422 si el cuerpo no es válido. El frontend redirige entonces a la página de login.
- **Login**: el cuerpo es `{ email, password }`. Responde `{ token, user }` o 401. `user` es `{ _id, name, email, role, createdAt, updatedAt }`, sin contraseña. El refresh token **no va en el
  JSON**: se deja en la cookie `refreshToken` (HttpOnly, SameSite=Strict, Path=/auth, Max-Age de 7 días; Secure en producción).
- **Refresh**: sin cuerpo. Lee el refresh token de la cookie y responde `{ token }` (un access token nuevo), o 401 si no hay cookie, ha caducado o no es válida. El refresh token no cambia.
- **Logout**: sin cuerpo. Borra la cookie y responde 204. Después, `/auth/refresh` responde 401.
- **Cookies y CORS**: el frontend llama a `/auth/*` con `withCredentials: true`; el backend responde con `Access-Control-Allow-Credentials: true` y el origen exacto de `CORS_ORIGIN` (no vale `*`).
- **Token**: se envía en la cabecera `Authorization: Bearer <token>`. Su payload lleva los claims `sub` (id del usuario), `role` y `exp`. El access token dura 15 minutos y el refresh token 7 días.
  El frontend guarda el access token solo en memoria (una signal), nunca en `localStorage` ni `sessionStorage`; al recargar la página lo recupera llamando a `/auth/refresh` y después a `/users/me`.
- **Errores de autenticación**: 401 si falta el token, ha caducado (`{ message: 'El token ha caducado' }`) o no es válido (`{ message: 'Token no válido' }`); 403 si hay sesión pero no el rol
  necesario.
- **Usuario con sesión**: `GET /users/me` (con sesión, cualquier rol) responde `{ user: { _id, name, email, role } }`, a partir del token (`req.user`).

## Tareas

### Sprint 1 (mínimo 1)

#### Estructura (`structure`)

- [x] Crear los dos repositorios a partir del Seminari 7 (README y ramas) · Diego
- [x] Montar el GitHub Project y cargar las tareas · María
- [x] Hoja de horas del equipo · Miguel Ángel
- [ ] Quitar autores, libros y chat del backend · María

#### Usuarios (`users`)

- [ ] Modelo User ampliado (perfil, activo, archivado) y datos de ejemplo · Diego
- [ ] Prehook de Mongoose "está activo" · Diego
- [ ] Gestión de usuarios: listado paginado, búsqueda, editar y cambiar rol · Diego
- [ ] Archivar, restaurar y eliminar para siempre (usuarios) · Diego

#### La Orla (`grades`)

- [ ] Modelo Grade (La Orla) con sus rutas de admin · María

#### Dates (`dates`)

- [ ] Modelo Date (citas) con sus rutas · María

#### Documentación (`docs`)

- [ ] Documentación de la API en Swagger · Diego
- [ ] Pruebas de la API (se hacen al cerrar cada rama y se apuntan en la bitácora) · Diego

#### Scrum

- [ ] Planning, seguimiento y retrospectiva · los tres
- [ ] Preparar la demo del sprint · Diego y María

## Bitácora

La bitácora del Seminario 7, de donde viene este código, se conserva en el tag `seminari7-base`
(`git show seminari7-base:LOGS.md`).

### 2026-11-03 · Punto de partida y `structure`

- El repositorio nace como copia del backend del ejercicio del Seminario 7. Antes de tocar nada se guarda ese
  código en el tag `seminari7-base`, para poder consultarlo cuando lo vayamos quitando.
- Identidad: el paquete pasa a llamarse `studate-backend`, el README cuenta qué es Studate y qué pide el
  mínimo 1, la base de datos por defecto pasa a ser `studate` y los secretos de clase de `.env.example`
  cambian de nombre. Swagger se titula "Studate API".
- Este LOGS.md empieza de cero con las tareas del Sprint 1 agrupadas por la rama en la que se hacen. Del
  contrato del seminario solo se queda la autenticación, que no cambia; lo demás se irá escribiendo en cada rama.
- Prompt de IA usado: «Lo que hemos hecho ha sido copiar y pegar lo que teníamos del seminario 7. Ahora hay que
  adaptarlo a lo nuestro, que es Studate. Para eso hay que hacer limpieza y dejar el repo preparado [...] Dime
  el plan de acción.» (conversación completa en `prompts/sprint-1.md`, fuera del repositorio).
