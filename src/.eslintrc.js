module.exports = {
    "extends": [
        "eslint:recommended"
    ],
    "env": {
        "jasmine": true
    },
    "plugins": [
        "jasmine"
    ],
    "parserOptions": {
        "ecmaVersion": 6,
        "sourceType": "module",
        "ecmaFeatures": {
            "experimentalObjectRestSpread": true
        }
    },
    "rules": {
        'max-len': ["error", { "code": 100, "comments": 120 }]
    }
};
