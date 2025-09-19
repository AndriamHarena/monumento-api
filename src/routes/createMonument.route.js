const { MonumentModel } = require('../db/sequelize');
const { handleError } = require('../../helper');

module.exports = (app) => {
    app.post('/api/monuments', async (req, res) => {
        const { monument } = req.body;

        try {

            const createdMonument = await MonumentModel.create(monument);

            const message = `Le monument ${createdMonument.title} a bien été créé.`;
            res.status(201).json({ message, data: createdMonument });

        } catch (error) {
            const message = "Le monument n'a pas pu être créé. Réessayez dans quelques instants.";
            return handleError(res, error, message);
        }
    });
}   