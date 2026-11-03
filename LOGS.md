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
- [x] Quitar autores, libros y chat del backend · María

#### Usuarios (`users`)

- [x] Modelo User ampliado (perfil, activo, archivado) y datos de ejemplo · Diego
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

### 2026-11-03 · Limpieza: fuera autores, libros y chat

- Se borran los modelos, controllers, services y rutas de autores y libros, el modelo `Message`, la carpeta
  `sockets/` (chat y avisos del backoffice), el middleware `SocketAuth` y los dos scripts de migración del
  seminario (`migrate-authors` y `migrate-indexes`), con sus comandos de `package.json`. Se desinstala `socket.io`.
- `server.ts` deja de montar `/authors`, `/books` y socket.io; sigue creando el servidor con `http.createServer`.
- Desaparece `GET /users` (la lista de id y nombre para el chat directo). `GET /users/me` se queda: el frontend lo
  usa para recuperar la sesión.
- Se quedan las piezas genéricas que se van a reutilizar: `ValidatePagination` y el esquema de paginación de Joi,
  `ValidateId`, `ErrorHandler`, `RequireRole`, `VerifyToken`, `escapeRegExp` y las respuestas comunes de Swagger.
- El seed solo crea los dos usuarios; la rama `users` lo amplía.
- README: fuera las secciones del chat, de autores y libros y de las migraciones; la estructura del proyecto,
  los endpoints y la tabla de rutas protegidas quedan al día.
- Decisión: quitar en lugar de comentar. El código del seminario sigue entero en el tag `seminari7-base`
  (`git show seminari7-base:src/services/BookService.ts`), que es de donde se copiará la forma de la paginación y
  del borrado lógico.
- Validación ejecutada: `npm run build` y `npm run lint` sin errores; `npm run seed -- --reset`; con la API
  arrancada, 8 pruebas con curl: login 200, `/users/me` 200 con token y 401 sin él, `/authors`, `/books` y `GET /users`
  404, `/api-docs` y `/ping` 200, y el documento de Swagger ya no tiene ninguna ruta ni esquema de autores o libros.
- Prompt de IA usado: el mismo de la limpieza del repositorio (ver la entrada anterior).

### 2026-11-03 · Modelo User ampliado y datos de ejemplo

- `User` pasa de `name`, `email`, `password` y `role` a tener también:
  - Perfil (opcional, como en el blog): `birthDate`, `degree` (titulación), `lookingFor` ("Qué busco", 100
    caracteres como mucho), `bio` (500 como mucho) y `photo`.
  - Estado de la cuenta: `active` (`true` por defecto) y el borrado lógico `deleted` + `deletedAt`, con los mismos
    nombres que usaban autores y libros en el seminario.
- Decisión: el email sigue siendo único entre **todos** los usuarios, también los archivados (índice único normal,
  no parcial como el de autores). Así restaurar un usuario nunca choca con otro que se haya quedado su email.
- Decisión: la foto se guarda dentro del usuario como texto en base64, con un máximo de 200 000 caracteres
  (`PHOTO_MAX_LENGTH`). No hace falta guardar ficheros ni otra librería; el frontend la reduce antes de enviarla.
- Seed: 14 usuarios con perfiles de estudiantes de la EETAC (inventados), contraseña `studate26`. Dos están
  inactivos (`aina`, `iker`) y dos archivados (`sara`, `dani`), para probar las tareas siguientes.
- Swagger: el esquema `User` y su ejemplo llevan los campos nuevos. README: usuarios de ejemplo y campos del usuario.
- Validación ejecutada: `npm run build` y `npm run lint` sin errores; `npm run seed -- --reset` crea 14 usuarios, y
  con `mongosh` se comprueba que hay 2 con `active: false`, 2 con `deleted: true` y las 14 contraseñas cifradas
  (`scrypt:...`). Con la API arrancada, el login de `laia@example.com` devuelve el usuario con los campos nuevos y sin
  contraseña. Todavía un usuario inactivo puede iniciar sesión: lo resuelve el prehook (siguiente tarea).
- Prompt de IA usado: «Empezamos por el modelo User. Antes de tocar nada, dime qué campos tendría, cómo quedaría la
  estructura del modelo, y ponme ejemplos de cada campo para ver qué necesitamos de verdad.»
