module.exports = {
    
    /**
     * @param {{ x: number, y: number }} positionA
     * @param {{ x: number, y: number }} positionB
     * @return {number}
     */
    positionDistance(positionA, positionB) {
        return Math.floor(Math.sqrt(Math.pow(positionB.x - positionA.x, 2) + Math.pow(positionB.y - positionA.y, 2)));
    }
};
