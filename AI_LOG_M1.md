# AI_LOG Mínimo 1

Herramienta: Claude Code (Anthropic). Modelo: Claude Opus 5.5.

Prompts del examen del Mínimo 1. Las mismas entradas están también al final de `AI_LOG.md`.

## 1. Requisitos del examen

- **Pregunta:** cómo vamos a trabajar durante el Mínimo 1.
- **Prompt:** «Estamos en el examen del mínimo 1 y ahora te paso los requisitos a cumplir. Hay que hacer commits constantes de cada cosa relevante que hagamos. Como lo hemos hecho en AI_LOG hay que registrar los prompts que hagamos en cada repositorio. Primero modificaremos el backend y luego el frontend, yo te dictaré el orden de las cosas. Una cosa que tiene que usarse bien es el JWT: lo que hagamos solo tiene que tener acceso el rol de admin, ya que modificaremos el backoffice, terreno del admin. En cada repositorio ya estamos en la rama develop; por cada feat relevante que hagamos tiene que estar en su propia rama con sus commits, que se acabarán pasando a develop y lo subiré yo a main.»
- **Incoherencias:** ninguna importante.
- **Solución:** una rama `feat/<modelo>` por funcionalidad que sale de `develop` y vuelve a ella con un merge `--no-ff`, sin push y sin tocar `main`. Las rutas nuevas llevan `VerifyToken` + `RequireRole('admin')` en el backend y `adminGuard` en el frontend. Los prompts se registran en `AI_LOG.md` y en `AI_LOG_M1.md`.

## 2. Elección del nuevo modelo

- **Pregunta:** qué modelo nuevo añadir que se relacione con una entidad existente que no sea User y que tenga un vector de subdocumentos con al menos 3 tipos de datos distintos.
- **Prompt:** «Empezaremos a crear un nuevo modelo tanto en el backend como en el frontend. Tienes nuestro blog que explica nuestra idea de proyecto (https://studateapp.blogspot.com/). Ahora me gustaría que me recomendaras un modelo que cumpla con los siguientes requisitos: nuevo modelo con relación a una entidad existente que no sea user. Ha de contener un vector de objetos (subdocumentos) con al menos 3 tipos de datos distintos. Primero decidimos este modelo y una vez lo tengamos claro procederemos a hacer el feat, que lo llamaremos por el nombre del modelo escogido. Y para que no haya dudas, solo trabajaremos dentro del backoffice.»
- **Incoherencias:** el blog no habla de un rol admin: el Plan lo cierran los dos usuarios desde la app. Aquí el que lo gestiona es el admin, desde el backoffice.
- **Solución:** elegimos el modelo `Plan`, que en el blog es el "Cambio de Aula". Va relacionado con `Date` (un Plan por Date) y tiene un vector `spins` con las tiradas de la ruleta: `place` (String), `walkingMinutes` (Number), `scheduledAt` (Date) y `accepted` (Boolean).

## 3. Requisitos totales y plan por feats

- **Pregunta:** qué hay que hacer en total con `Plan` y cómo dividirlo en feats, separando backend y frontend.
- **Prompt:** «Una vez tengamos el modelo Plan (usemos su nombre en inglés) hay que hacer su CRUD completo (hard delete y soft delete incluidos) más lo que sea necesario para realizar el mínimo 1. Hay que hacer la paginación desde el servidor, usando populate en MongoDB para las relaciones. Esto tiene que poder filtrarse con al menos 2 combinaciones a la misma ruta de la lista (uno de texto y otro que sea necesario, que no sea texto). Por supuesto esto tiene que estar correctamente validado con Joi, usando los 400, 422, 404, 409. Ya en el frontend tenemos que añadir un Service nuevo que concentre todas las peticiones. Necesitamos 2 nuevos componentes standalone (lista y formulario/detalles) integrados en una vista existente de la entidad relacionada. Usaremos 3 llamadas del nuevo endpoint, obligatoriamente el listado paginado (paginación de servidor + cerca). Cuando hagamos la parte visual quiero un mockup, un HTML que guardarás en el repo de frontend para ver cómo quedará la página modificada. Dime el plan de acción dividido en feats y qué pertenece al backend y qué al frontend.»
- **Incoherencias:** la vista de Dates la usan el admin y los usuarios normales (la ruta solo tiene `authGuard`), así que los componentes de Plan no pueden ir protegidos por la ruta. Además, borrar un Date para siempre dejaría su Plan huérfano.
- **Solución:** tres feats en el backend (`feat/plan-model`, `feat/plan-list`, `feat/plan-crud`) y cuatro en el frontend (`feat/plan-mockup`, `feat/plan-service`, `feat/plan-list`, `feat/plan-form`). Los componentes van dentro de la vista de Dates, solo con `isAdmin()`, y la API responde 403 a cualquier rol que no sea admin. Al borrar un Date se borra también su Plan.

## 4. B1: modelo Plan (`feat/plan-model`)

- **Pregunta:** cómo es el modelo `Plan`, su validación con Joi y sus datos de ejemplo.
- **Prompt:** «Me parece bien la división. Por cada feat quiero ver el código nuevo que vas a añadir, así validando tu plan de acción por cada feat con mi ok. Para el feat 3 te pediré el mockup HTML que te he mencionado previamente. Venga, empezamos con el B1, dime cuál es el plan de acción (recuerda que quiero ver el código que vamos a implementar).»
- **Incoherencias:** ninguna en el código. Antes de proponerla comprobamos que la regla custom de Joi ("una sola tirada aceptada") da un error con `details`, que el ErrorHandler responde como 422. El permiso de Claude Code bloqueó `npm run seed -- --reset` porque borra la BD, así que lo lancé yo a mano.
- **Solución:** `src/models/Plan.ts` con el subdocumento `Spin` (String, Number, Date, Boolean), los esquemas Joi `plan.create`, `plan.update` y `planList`, y Planes de ejemplo en el seed.

## 5. B2: listado paginado y detalle de Planes (`feat/plan-list`)

- **Pregunta:** cómo listar los Planes paginados desde el servidor, con populate y filtros combinables, solo para admin.
- **Prompt:** «Ya está hecho. Comprueba que está bien, haz los commits, cierras el feat y procedemos al siguiente feat donde me dirás el plan de acción.»
- **Incoherencias:** la búsqueda con regex no ignora los acentos: "cafeteria" no encuentra "Cafetería" (sí lo encuentra "cafe").
- **Solución:** `PlanService.getPlans` hace `find` + populate anidado (Plan, luego Date, luego los dos usuarios) + `skip`/`limit` + `countDocuments`. Los filtros `search`, `status`, `date` y `archived` se combinan en `GET /plans`, y `GET /plans/:planId` devuelve el detalle. Las dos rutas llevan `VerifyToken` + `RequireRole('admin')`.

## 6. B3: CRUD de Planes (`feat/plan-crud`)

- **Pregunta:** cómo crear, editar, archivar, restaurar y eliminar Planes con los códigos 404 y 409 correctos, solo para admin.
- **Prompt:** «Procede, tienes mi ok» (cierre de B2, junto al que Claude propuso el plan de B3) y «OK» (aprobación del plan de B3).
- **Incoherencias:** el borrado físico de un Date dejaba su Plan huérfano: el populate habría devuelto `date: null`.
- **Solución:** `PlanService` devuelve `{ error }` y el controlador lo traduce a 404 o 409 con una tabla de mensajes. El Plan se edita con `save()` para que pasen los validadores del modelo. El hard delete solo se permite si el Plan está archivado, y `DateService.deleteDate` elimina también el Plan del Date.
