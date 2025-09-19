const { MonumentModel } = require('../db/sequelize');
const { handleError } = require('../../helper');

module.exports = (app) => {
    app.post('/api/monuments', async (req, res) => {
        const { monument } = req.body;

        try {

            const createdMonument = await MonumentModel.create(monument);

            // Emit WebSocket notification to all connected clients
            try {
                const io = req.app.get('io');
                if (io) {
                    // Build createdAt without milliseconds as required by the spec
                    const createdDate = (createdMonument.created instanceof Date)
                        ? createdMonument.created
                        : new Date(createdMonument.created || Date.now());
                    const createdAtISO = createdDate.toISOString().replace(/\.\d{3}Z$/, 'Z');

                    io.emit('notification', {
                        event: 'newMonument',
                        data: {
                            id: createdMonument.id,
                            title: createdMonument.title,
                            description: createdMonument.description,
                            createdAt: createdAtISO
                        }
                    });
                }
            } catch (socketError) {
                // Ne pas bloquer la réponse API si la notification échoue
                console.error('Erreur lors de l\'émission Socket.IO newMonument:', socketError);
            }

            const message = `Le monument ${createdMonument.title} a bien été créé.`;
            res.status(201).json({ message, data: createdMonument });

        } catch (error) {
            const message = "Le monument n'a pas pu être créé. Réessayez dans quelques instants.";
            return handleError(res, error, message);
        }
    });
}