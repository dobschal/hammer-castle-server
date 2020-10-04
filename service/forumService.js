const db = require("../lib/database");

module.exports = {

    /**
     * @param {CreateCategoryRequest} request
     */
    createCategory(request) {
        const {lastInsertRowid} = db.prepare("INSERT INTO forum_category (name, description) VALUES (?,?);").run(request.name, request.description);
        return this.getCategoryById(lastInsertRowid);
    },

    /**
     * @param {UpdateCategoryRequest} request
     */
    updateCategory(request) {
        db.prepare("UPDATE forum_category SET name=?, description=? WHERE id=?").run(request.name, request.description, request.id);
    },

    /**
     * @param {number} id
     */
    deleteCategory(id) {
        db.prepare("DELETE FROM forum_category WHERE id=?").run(id);
    },

    /**
     *
     * @return {ForumCategory[]}
     */
    getAllCategories() {
        return db.prepare("SELECT * FROM forum_category").all();
    },

    /**
     * @param {number} id
     * @return {ForumCategory}
     */
    getCategoryById(id) {
        return db.prepare("SELECT * FROM forum_category WHERE id=?").get(id);
    }
};
