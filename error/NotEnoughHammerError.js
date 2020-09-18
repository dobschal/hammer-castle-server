// class NotEnoughHammerError extends Error {
//     constructor(message) {
//         super(message);
//         this.message = message;
//         this.status = 400;
//     }
//
//     toString() {
//         return `NotEnoughHammerError: ${this.status}. ${this.message}`;
//     }
// }
//
// module.exports = NotEnoughHammerError;
function NotEnoughHammerError(message) {
    this.status = 409;
    this.message = message;
}

NotEnoughHammerError.prototype.toString = function () {
    return `NotEnoughHammerError: ${this.status}. ${this.message}`;
};

module.exports = NotEnoughHammerError;
