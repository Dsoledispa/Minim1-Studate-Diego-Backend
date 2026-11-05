# AI_LOG

Herramienta: Claude Code (Anthropic). Modelo: Claude Opus 5.5.

## 1. Limpieza del código del Seminario 7

- **Pregunta:** cómo quitar autores, libros y chat del seminario y dejar el repo preparado para Studate.
- **Prompt:** «Lo que hemos hecho ha sido copiar y pegar lo que teníamos del seminario 7. Ahora hay que adaptarlo a lo nuestro, que es Studate. Para eso hay que hacer limpieza y dejar el repo preparado: quitar los autores, los libros y el chat, y dejar la estructura simple, la cáscara, para luego poner lo nuestro. De momento solo quitar y limpiar, para tener una base sólida. Dime el plan de acción: cómo lo eliminarías y cuál sería la forma correcta de hacerlo.»
- **Incoherencias:** ninguna importante.
- **Solución:** guardamos el código del seminario en el tag `seminari7-base` antes de borrar y mantuvimos las piezas genéricas (paginación, Joi, ErrorHandler, VerifyToken, RequireRole).

## 2. Modelo User

- **Pregunta:** qué campos necesita el usuario de Studate.
- **Prompt:** «Empezamos por el modelo User. Antes de tocar nada, dime qué campos tendría, cómo quedaría la estructura del modelo, y ponme ejemplos de cada campo para ver qué necesitamos de verdad. Luego me pasas el plan de acción y lo vemos.»
- **Incoherencias:** no decía dónde guardar la foto de perfil.
- **Solución:** la foto se guarda en el propio usuario en base64 con un límite de tamaño. El email sigue siendo único también para los archivados.

## 3. Prehook "está activo"

- **Pregunta:** qué es el prehook de usuarios activos y cómo hacerlo.
- **Prompt:** «Ahora el prehook de Mongoose de "está activo". No me acuerdo bien de en qué consistía. Explícame de qué va, por qué tiene sentido esta tarea, y dame el plan de acción.»
- **Incoherencias:** el prehook solo frenaba el login y el refresh. Un usuario desactivado seguía usando la API con su token hasta que caducaba.
- **Solución:** `VerifyToken` comprueba en cada petición que el usuario sigue activo y si no responde 401.

## 4. Gestión de usuarios

- **Pregunta:** listado paginado con búsqueda, editar y cambiar rol.
- **Prompt:** «Siguiente: gestión de usuarios, listado paginado, búsqueda, editar y cambiar rol. Hay que montar esta funcionalidad. ¿Cómo lo harías? ¿Cuál sería el plan de acción?»
- **Incoherencias:** faltaba el filtro por titulación que luego pedía la pantalla del frontend.
- **Solución:** añadimos el filtro `degree` a `GET /users` (Joi, service y Swagger).

## 5. Archivar, restaurar y eliminar

- **Pregunta:** soft delete y hard delete de usuarios.
- **Prompt:** «Ahora archivar, restaurar y eliminar para siempre usuarios. ¿Cómo lo harías? Y recuérdame cómo era esto del soft delete y el hard delete, porque nos lo comentaron en clase y si no me equivoco había que usar soft delete: para gestionarlo bien, los usuarios se archivan más que eliminarse. Dame el plan de acción.»
- **Incoherencias:** ninguna importante.
- **Solución:** solo se puede eliminar un usuario archivado (409 si no) y un admin no se puede archivar ni eliminar a sí mismo.

## 6. Modelo Grade (La Orla)

- **Pregunta:** qué atributos necesita un voto de La Orla.
- **Prompt:** «Montamos lo mismo con el modelo Grade, el de La Orla. ¿Qué atributos necesita este modelo para lo que queremos montar en Studate? Dame el plan de acción.»
- **Incoherencias:** con el `populate`, un usuario inactivo salía como `null` (pasaba por el prehook). Y el 409 de un voto repetido decía "from ya existe".
- **Solución:** `populate` con `withInactive: true`, y comprobar antes de guardar si la pareja ya tiene voto para responder "Este usuario ya ha votado ese perfil".

## 7. Modelo Date

- **Pregunta:** qué atributos necesita un Date y cómo abrirlo con el A+ mutuo.
- **Prompt:** «Igual con el modelo Date, el de las citas. ¿Qué atributos necesita para lo que queremos en Studate? Dame el plan de acción.»
- **Incoherencias:** un modelo llamado `Date` tapa el `Date` de JavaScript. Y un usuario normal no tenía forma de sacar la lista de usuarios para abrir un Date (`GET /users` es solo del admin).
- **Solución:** el modelo se importa como `DateModel`. Añadimos `GET /users/directory` para cualquier usuario con sesión.

## 8. Swagger

- **Pregunta:** ampliar la documentación de Swagger con todo lo nuevo.
- **Prompt:** «Toca montar la documentación de la API en Swagger. Ya has visto cómo lo hacemos: Joi conectado con Swagger. Simplemente sería ampliarlo con todo lo nuevo.»
- **Incoherencias:** algunos errores usaban ejemplos genéricos que no eran los mensajes reales de la API.
- **Solución:** respuestas propias con el mensaje real (`GradeConflict`, `DateConflict`, `NotYourDate`) y el 401 de cuenta no activa.

# Mínimo 1

### 1. Requisitos del examen

- **Pregunta:** cómo vamos a trabajar durante el Mínimo 1.
- **Prompt:** «Estamos en el examen del mínimo 1 y ahora te paso los requisitos a cumplir. Hay que hacer commits constantes de cada cosa relevante que hagamos. Como lo hemos hecho en AI_LOG hay que registrar los prompts que hagamos en cada repositorio. Primero modificaremos el backend y luego el frontend, yo te dictaré el orden de las cosas. Una cosa que tiene que usarse bien es el JWT: lo que hagamos solo tiene que tener acceso el rol de admin, ya que modificaremos el backoffice, terreno del admin. En cada repositorio ya estamos en la rama develop; por cada feat relevante que hagamos tiene que estar en su propia rama con sus commits, que se acabarán pasando a develop y lo subiré yo a main.»
- **Incoherencias:** ninguna importante.
- **Solución:** una rama `feat/<modelo>` por funcionalidad que sale de `develop` y vuelve a ella con un merge `--no-ff`, sin push y sin tocar `main`. Las rutas nuevas llevan `VerifyToken` + `RequireRole('admin')` en el backend y `adminGuard` en el frontend. Los prompts se registran en `AI_LOG.md` y en `AI_LOG_M1.md`.

### 2. Elección del nuevo modelo

- **Pregunta:** qué modelo nuevo añadir que se relacione con una entidad existente que no sea User y que tenga un vector de subdocumentos con al menos 3 tipos de datos distintos.
- **Prompt:** «Empezaremos a crear un nuevo modelo tanto en el backend como en el frontend. Tienes nuestro blog que explica nuestra idea de proyecto (https://studateapp.blogspot.com/). Ahora me gustaría que me recomendaras un modelo que cumpla con los siguientes requisitos: nuevo modelo con relación a una entidad existente que no sea user. Ha de contener un vector de objetos (subdocumentos) con al menos 3 tipos de datos distintos. Primero decidimos este modelo y una vez lo tengamos claro procederemos a hacer el feat, que lo llamaremos por el nombre del modelo escogido. Y para que no haya dudas, solo trabajaremos dentro del backoffice.»
- **Incoherencias:** el blog no habla de un rol admin: el Plan lo cierran los dos usuarios desde la app. Aquí el que lo gestiona es el admin, desde el backoffice.
- **Solución:** elegimos el modelo `Plan`, que en el blog es el "Cambio de Aula". Va relacionado con `Date` (un Plan por Date) y tiene un vector `spins` con las tiradas de la ruleta: `place` (String), `walkingMinutes` (Number), `scheduledAt` (Date) y `accepted` (Boolean).

### 3. Requisitos totales y plan por feats

- **Pregunta:** qué hay que hacer en total con `Plan` y cómo dividirlo en feats, separando backend y frontend.
- **Prompt:** «Una vez tengamos el modelo Plan (usemos su nombre en inglés) hay que hacer su CRUD completo (hard delete y soft delete incluidos) más lo que sea necesario para realizar el mínimo 1. Hay que hacer la paginación desde el servidor, usando populate en MongoDB para las relaciones. Esto tiene que poder filtrarse con al menos 2 combinaciones a la misma ruta de la lista (uno de texto y otro que sea necesario, que no sea texto). Por supuesto esto tiene que estar correctamente validado con Joi, usando los 400, 422, 404, 409. Ya en el frontend tenemos que añadir un Service nuevo que concentre todas las peticiones. Necesitamos 2 nuevos componentes standalone (lista y formulario/detalles) integrados en una vista existente de la entidad relacionada. Usaremos 3 llamadas del nuevo endpoint, obligatoriamente el listado paginado (paginación de servidor + cerca). Cuando hagamos la parte visual quiero un mockup, un HTML que guardarás en el repo de frontend para ver cómo quedará la página modificada. Dime el plan de acción dividido en feats y qué pertenece al backend y qué al frontend.»
- **Incoherencias:** la vista de Dates la usan el admin y los usuarios normales (la ruta solo tiene `authGuard`), así que los componentes de Plan no pueden ir protegidos por la ruta. Además, borrar un Date para siempre dejaría su Plan huérfano.
- **Solución:** tres feats en el backend (`feat/plan-model`, `feat/plan-list`, `feat/plan-crud`) y cuatro en el frontend (`feat/plan-mockup`, `feat/plan-service`, `feat/plan-list`, `feat/plan-form`). Los componentes van dentro de la vista de Dates, solo con `isAdmin()`, y la API responde 403 a cualquier rol que no sea admin. Al borrar un Date se borra también su Plan.

### 4. B1: modelo Plan (`feat/plan-model`)

- **Pregunta:** cómo es el modelo `Plan`, su validación con Joi y sus datos de ejemplo.
- **Prompt:** «Me parece bien la división. Por cada feat quiero ver el código nuevo que vas a añadir, así validando tu plan de acción por cada feat con mi ok. Para el feat 3 te pediré el mockup HTML que te he mencionado previamente. Venga, empezamos con el B1, dime cuál es el plan de acción (recuerda que quiero ver el código que vamos a implementar).»
- **Incoherencias:** ninguna en el código. Antes de proponerla comprobamos que la regla custom de Joi ("una sola tirada aceptada") da un error con `details`, que el ErrorHandler responde como 422. El permiso de Claude Code bloqueó `npm run seed -- --reset` porque borra la BD, así que lo lancé yo a mano.
- **Solución:** `src/models/Plan.ts` con el subdocumento `Spin` (String, Number, Date, Boolean), los esquemas Joi `plan.create`, `plan.update` y `planList`, y Planes de ejemplo en el seed.
