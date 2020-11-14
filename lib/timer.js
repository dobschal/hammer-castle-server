const timer = {

    times: {},

    start(name) {
        timer.times[name] = Date.now();
    },

    end(name) {
        const result = Date.now() - timer.times[name];
        if (result < 200) {
            console.log("[timer] " + result + "ms \t- " + name);
        } else {
            console.error("[timer] " + result + "ms \t- " + name + ". (Timer threshold exceeded!)");
        }
    }
};

module.exports = timer;
