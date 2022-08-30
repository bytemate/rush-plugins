/* eslint-env es6 */
const ejs = require("ejs");

module.exports = function (plop) {
  // A easy way to use custom render engine.
  plop.renderString = function (template, data) {
    return ejs.render(template, data);
  };
};
