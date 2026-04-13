const pool = require('../db/pool');

const shoppingController = {
    getShoppingList: async (req, res) => {
        try {
            console.log("User Data from Token:", req.user);

            // Check for both 'id' and 'userId'
            const userId = req.user.id || req.user.userId || req.user.sub;

            if (!userId) {
                console.error("No ID found in token!");
                return res.status(401).json({ error: "Unauthorized: No user ID" });
            }

            const [rows] = await pool.query("SELECT shopping_list FROM users WHERE id = ?", [userId]);
            res.status(200).json({ listContent: rows[0]?.shopping_list || "" });
        } catch (err) {
            console.error("GET Error:", err);
            res.status(500).json({ error: "Server error fetching list" });
        }
    },

    updateShoppingList: async (req, res) => {
        try {
            const { listContent } = req.body;
            const userId = req.user.id || req.user.userId || req.user.sub;

            if (!userId) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            console.log(`Updating list for User ${userId}...`);
            await pool.query("UPDATE users SET shopping_list = ? WHERE id = ?", [listContent, userId]);
            
            // This is the line that stops the "Indefinite Saving"
            res.status(200).json({ message: "Saved" }); 
        } catch (err) {
            console.error("POST Error:", err);
            res.status(500).json({ error: "Server error saving list" });
        }
    }
};

module.exports = shoppingController;