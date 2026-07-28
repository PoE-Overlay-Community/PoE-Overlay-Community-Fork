// Karma configuration file, see link for more information
// https://karma-runner.github.io/1.0/config/configuration-file.html
var generateBaseConfig = require('./karma-base.conf');

module.exports = function (config) {
  config.set(generateBaseConfig(config));
};
