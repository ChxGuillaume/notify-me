const moment = require('moment');

module.exports = function (message) {
    console.log(`[${moment().format('YYYY-MM-DD HH:mm:ss')}]`.gray, message.blue);
}
