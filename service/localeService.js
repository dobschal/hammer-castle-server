const userService = require("./userService");
const db = require("../lib/database");
const locales = {
    en: require("../lang/locale-en"),
    de: require("../lang/locale-de")
};

function _getObjectPropByPath(path, obj) {
    return path.split('.').reduce(function (a, b) {
        return a && a[b];
    }, obj);
}

const self = {
    /**
     * @param {UserEntity} user
     * @param {string} locale - "en"
     */
    updateLocale(user, locale) {
        setTimeout(() => {
            db.prepare("update user set locale=@locale where id=@id").run({
                locale,
                id: user.id
            });
        });
    },

    /**
     * @param {Error} err
     * @param {string} locale
     * @return {string}
     */
    translateError(err, locale) {
        if (err.message) {
            const message = _getObjectPropByPath(err.message, locales[locale]);
            return message || err.message;
        }
        return "An unhandled error occurred.";
    },

    /**
     * @param {string} key
     * @param {string} locale
     * @param {string[]|number[]} params
     * @return {string}
     */
    translate(key, locale, params) {
        let message = _getObjectPropByPath(key, locales[locale]);
        params.forEach(param => message = message.replace("{}", param));
        return message;
    }
};

module.exports = self;
