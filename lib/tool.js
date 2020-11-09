module.exports = {

    /**
     * @param {{ x: number, y: number }} positionA
     * @param {{ x: number, y: number }} positionB
     * @return {number}
     */
    positionDistance(positionA, positionB) {
        return Math.floor(Math.sqrt(Math.pow(positionB.x - positionA.x, 2) + Math.pow(positionB.y - positionA.y, 2)));
    },

    /**
     * @param {string} timestamp - format "2020-05-29 12:12:12"
     * @return {Date} - UTC
     */
    dateFromDbTimestamp(timestamp) {
        return new Date(Date.parse(timestamp.replace(" ", "T") + ".000Z"));
    },

    /**
     * Get a random UUID
     * @return {string}
     */
    createRandomId() {
        let dt = new Date().getTime();
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = (dt + Math.random() * 16) % 16 | 0;
            dt = Math.floor(dt / 16);
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    },
};
