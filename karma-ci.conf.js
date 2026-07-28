var generateBaseConfig = require('./karma-base.conf');

module.exports = function(config) {
  config.set(Object.assign({}, generateBaseConfig(config), {
    autoWatch: false,
    singleRun: true
  }));
}
