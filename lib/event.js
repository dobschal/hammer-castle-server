const tool = require("./tool.js");

const bus = [];

const event = {

    USER_CONNECTED: "USER_CONNECTED",

    /**
     * @param {string} name
     * @param {*} data
     */
    emit(name, data) {
        bus
            .filter(busEntry => busEntry.name === name)
            .forEach(busEntry => busEntry.callback(data));
    },

    /**
     * @param {string} name
     * @param {function} callback
     */
    on(name, callback) {
        const id = tool.createRandomId();
        bus.push({
            id, callback, name
        });
    },

    /**
     * @param {string} id
     */
    delete(id) {
        const index = bus.findIndex(busEntry => busEntry.id === id);
        if (index > -1) {
            bus.splice(index, 1);
        } else {
            console.error("[event] Tried to delete non existing event listener.");
        }
    }
};

module.exports = event;
