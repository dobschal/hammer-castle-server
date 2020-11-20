const timer = {

    times: {},

    start(name) {
        timer.times[name] = Date.now();
    },

    end(name, message = "") {
        const result = Date.now() - timer.times[name];
        if (result < 50) {
            console.log("[timer] " + result + "ms\t- " + name + "\t- " + message);
        } else if (result < 200) {
            console.warn("[timer] " + result + "ms\t- " + name + "\t- " + message);
        } else {
            console.error("[timer] " + result + "ms\t- " + name+ "\t- " + message + "\t- (Timer threshold exceeded!)");
        }
    }
};

module.exports = timer;
