import mongoose from 'mongoose';
import { config } from './config/config';
import Logging from './library/Logging';
import User from './models/User';
import { usersSeed } from './seed-data';

// Llena la base de datos con los datos de ejemplo de seed-data.ts.
//
//   npm run seed             inserta los datos solo si la base de datos está vacía
//   npm run seed -- --reset  borra los usuarios y los vuelve a insertar
//
// Siempre trabaja sobre la base de datos del .env (MONGO_URL).

const reset = process.argv.includes('--reset');

const seed = async () => {
    await mongoose.connect(config.mongo.url);
    Logging.info(`Conectado a ${config.mongo.url}`);

    if (reset) {
        // Ojo: deleteMany({}) es un borrado fisico real y a proposito.
        // El reset del seed rehace los datos desde cero, tambien los que estaban archivados.
        const users = await User.deleteMany({});
        Logging.warning(`Borrados ${users.deletedCount} usuarios`);
    }

    const usersInDb = await User.countDocuments();

    if (usersInDb > 0) {
        Logging.warning('La base de datos ya tiene datos. Para rehacerla: npm run seed -- --reset');
        return;
    }

    // create() dispara los hooks del modelo: la contrasena del usuario se guarda cifrada
    const createdUsers = await User.create(usersSeed);
    Logging.info(`Usuarios creados: ${createdUsers.length}`);
};

seed()
    .catch((error) => {
        Logging.error(error);
        process.exitCode = 1;
    })
    .finally(() => mongoose.disconnect());
