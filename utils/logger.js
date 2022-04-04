const moment = require('moment');
const colors = require('colors');

module.exports = function (message, color = 'blue') {
    console.log(`[${moment().format('YYYY-MM-DD HH:mm:ss')}]`.gray, colors[color](message));
}
