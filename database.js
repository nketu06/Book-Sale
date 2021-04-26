const mysql = require('mysql2');
const dbConnection = mysql.createPool({
    host     : 'localhost', // MYSQL HOST NAME
    user     : 'root',        // MYSQL USERNAME    // MYSQL PASSWORD
    database : 'book_sale'      // MYSQL DB NAME
}).promise();
module.exports = dbConnection;
