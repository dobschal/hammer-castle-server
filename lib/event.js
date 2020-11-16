const tool = require("./tool.js");
const config = require("../config");

const bus = [];

const event = {

    ...config.EVENTS,

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
     * @param {string|string[]} names
     * @param {function} callback
     * @return {string[]} - event handler ids
     */
    on(names, callback) {
        if (!Array.isArray(names)) names = [names];
        return names.map(name => {
            const id = tool.createRandomId();
            bus.push({
                id, callback, name
            });
            return id;
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
