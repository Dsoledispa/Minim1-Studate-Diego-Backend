import mongoose, { Document, Schema } from 'mongoose';

// Estados de un Plan, el "Cambio de Aula" del blog:
//   proposing  Proponiendo: la pareja esta girando la ruleta de sitios
//   confirmed  Confirmado: los dos han aceptado una tirada (sitio, dia y hora). Es el "Plan" del blog
//   cancelled  Cancelado: al final no quedan
export const PLAN_STATUSES = ['proposing', 'confirmed', 'cancelled'] as const;
export type PlanStatus = (typeof PLAN_STATUSES)[number];

// La ruleta da 3 tiradas al dia, asi que un Plan tiene como mucho 3
export const MAX_SPINS = 3;

// Una tirada de la ruleta: un sitio real cerca del campus, cuando quedar y si se ha aceptado.
// Son los subdocumentos del Plan, con cuatro tipos de datos distintos (String, Number, Date y Boolean)
export interface ISpin {
    // El sitio, por ejemplo "Cafetería de la EETAC"
    place: string;

    // Minutos a pie desde el campus. El blog dice "sin coordenadas", asi que guardamos la distancia
    // como tiempo andando y no como una ubicacion
    walkingMinutes: number;

    // Dia y hora propuestos para quedar
    scheduledAt: Date;

    // Si la pareja ha aceptado esta tirada. Como mucho una por Plan (lo valida Joi)
    accepted: boolean;
}

// Un Plan se hace sobre un Date: es el paso siguiente cuando dos usuarios ya hablan
export interface IPlan {
    // Referencia al Date. Un Date tiene como mucho un Plan
    date: mongoose.Types.ObjectId | string;

    status: PlanStatus;

    spins: ISpin[];

    // Borrado logico, igual que en los usuarios: un Plan archivado se puede restaurar.
    // Eliminarlo para siempre (borrado fisico) solo se puede hacer si antes esta archivado
    deleted: boolean;

    deletedAt?: Date;
}

// Esta interfaz junta los datos del Plan con las propiedades de un documento de MongoDB
export interface IPlanModel extends IPlan, Document {}

// Esquema de cada tirada. Mongoose le da a cada una su propio _id, que le sirve al frontend para
// distinguirlas en la lista
const SpinSchema = new Schema<ISpin>({
    place: { type: String, required: true, trim: true, maxlength: 100 },

    walkingMinutes: { type: Number, required: true, min: 0, max: 120 },

    scheduledAt: { type: Date, required: true },

    accepted: { type: Boolean, default: false }
});

const PlanSchema: Schema = new Schema(
    {
        // Referencia al modelo Date, igual que from y to en los votos apuntan a User.
        // unique: si se intenta un segundo Plan para el mismo Date, MongoDB lanza un error 11000 (409).
        // Como el email de los usuarios, sigue siendo unico tambien con el Plan archivado
        date: { type: Schema.Types.ObjectId, ref: 'Date', required: true, unique: true },

        // Al crearse, un Plan esta en "Proponiendo"
        status: { type: String, enum: PLAN_STATUSES, default: 'proposing' },

        // El vector de subdocumentos. Joi ya lo valida en la API; esta es la segunda capa
        // (por ejemplo, para el seed, que no pasa por Joi)
        spins: {
            type: [SpinSchema],
            validate: {
                validator: (spins: ISpin[]) => spins.length >= 1 && spins.length <= MAX_SPINS,
                message: `Un Plan tiene entre 1 y ${MAX_SPINS} tiradas`
            }
        },

        deleted: { type: Boolean, default: false },

        deletedAt: { type: Date }
    },
    {
        timestamps: true,

        versionKey: false
    }
);

export default mongoose.model<IPlanModel>('Plan', PlanSchema);
