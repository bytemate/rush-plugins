/* eslint-env es6 */
const ora = require("ora");

module.exports = function (text) {
  const spinner = ora(text);
  spinner.stream = process.stdout;
  return spinner;
};
