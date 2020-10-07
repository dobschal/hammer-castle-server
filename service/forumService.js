const db = require("../lib/database");

const forumEntryQuery = `
    e.id, 
    e.category_id as categoryId, 
    e.user_id as userId, 
    e.content, 
    u.username,
    u.color,
    e.timestamp
`;

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
    },

    /**
     * @param {number} id
     * @return {ForumEntry}
     */
    getEntryById(id) {
        return db.prepare(`SELECT ${forumEntryQuery}
                           FROM forum_entry e JOIN user u on e.user_id = u.id
                           WHERE e.id = ?`).get(id);
    },

    /**
     * @return {ForumEntry[]}
     */
    getAllEntries() {
        return db.prepare(`SELECT ${forumEntryQuery}
                           FROM forum_entry e JOIN user u on e.user_id = u.id`).all();
    },

    /**
     * @param {CreateForumEntryRequest} request
     * @param {number} userId
     */
    createEntry(request, userId) {
        const {lastInsertRowid} = db
            .prepare("INSERT INTO forum_entry (category_id, user_id, content, timestamp) VALUES (?,?, ?, ?);")
            .run(request.categoryId, userId, request.content, Date.now());
        return this.getEntryById(lastInsertRowid);
    },

    /**
     * @param {number} categoryId
     * @return {ForumEntry[]}
     */
    getEntriesByCategoryId(categoryId) {
        return db.prepare(`SELECT ${forumEntryQuery}
                           FROM forum_entry e JOIN user u on e.user_id = u.id
                           WHERE e.category_id = ?`).all(categoryId);
    }
};
