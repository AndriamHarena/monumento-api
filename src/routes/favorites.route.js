const { FavoriteModel, MonumentModel, UserModel } = require('../db/sequelize');
const { handleError } = require('../../helper');

module.exports = (app) => {
    // POST /favorites/:monumentId -> add to favorites for connected user
    app.post('/api/favorites/:monumentId', async (req, res) => {
        const monumentId = parseInt(req.params.monumentId, 10);
        try {
            // Retrieve connected user from JWT payload
            const username = req.user?.userName;
            if (!username) {
                return res.status(401).json({ message: "Utilisateur non authentifié", data: null });
            }

            const user = await UserModel.findOne({ where: { username } });
            if (!user) {
                return res.status(401).json({ message: "Utilisateur non trouvé", data: null });
            }

            const monument = await MonumentModel.findByPk(monumentId);
            if (!monument) {
                return res.status(404).json({ message: `Le monument avec l'ID ${monumentId} n'existe pas.`, data: null });
            }

            // Prevent duplicates explicitly to return a friendly 400 message
            const existing = await FavoriteModel.findOne({ where: { userId: user.id, monumentId } });
            if (existing) {
                return res.status(400).json({ message: "Ce monument est déjà dans vos favoris.", data: null });
            }

            const favorite = await FavoriteModel.create({ userId: user.id, monumentId });

            const message = `Le monument '${monument.title}' a été ajouté à vos favoris.`;
            return res.status(201).json({ message, data: favorite });
        } catch (error) {
            const message = "Impossible d'ajouter ce monument aux favoris.";
            return handleError(res, error, message);
        }
    });

    // DELETE /favorites/:monumentId -> remove from favorites for connected user
    app.delete('/api/favorites/:monumentId', async (req, res) => {
        const monumentId = parseInt(req.params.monumentId, 10);
        try {
            const username = req.user?.userName;
            if (!username) {
                return res.status(401).json({ message: "Utilisateur non authentifié", data: null });
            }
            const user = await UserModel.findOne({ where: { username } });
            if (!user) {
                return res.status(401).json({ message: "Utilisateur non trouvé", data: null });
            }

            const favorite = await FavoriteModel.findOne({ where: { userId: user.id, monumentId } });
            if (!favorite) {
                return res.status(404).json({ message: "Ce monument n'est pas dans vos favoris.", data: null });
            }

            await favorite.destroy();

            const message = `Le monument avec l'ID ${monumentId} a été retiré de vos favoris.`;
            return res.json({ message, data: { userId: user.id, monumentId } });
        } catch (error) {
            const message = "Impossible de supprimer ce monument des favoris.";
            return handleError(res, error, message);
        }
    });

    // GET /favorites -> list favorite monuments for connected user
    app.get('/api/favorites', async (req, res) => {
        try {
            const username = req.user?.userName;
            if (!username) {
                return res.status(401).json({ message: "Utilisateur non authentifié", data: null });
            }
            const user = await UserModel.findOne({ where: { username } });
            if (!user) {
                return res.status(401).json({ message: "Utilisateur non trouvé", data: null });
            }

            const monuments = await user.getFavoriteMonuments({ joinTableAttributes: [], through: { attributes: [] } });

            const message = "Liste des monuments favoris récupérée avec succès.";
            return res.json({ message, data: monuments });
        } catch (error) {
            const message = "Impossible de récupérer la liste des favoris.";
            return handleError(res, error, message);
        }
    });
};
