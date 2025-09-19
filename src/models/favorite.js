module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Favorite', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                notNull: { msg: 'L\'utilisateur est requis.' },
                isInt: { msg: 'userId doit être un entier.' }
            }
        },
        monumentId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                notNull: { msg: 'Le monument est requis.' },
                isInt: { msg: 'monumentId doit être un entier.' }
            }
        }
    }, {
        timestamps: true,
        createdAt: 'created',
        updatedAt: false,
        indexes: [
            {
                unique: true,
                fields: ['userId', 'monumentId']
            }
        ]
    });
};
