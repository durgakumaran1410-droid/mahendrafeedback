const bcrypt = require('bcrypt');
const hashInDb = '$2b$10$UeFM4xcrgSc0wenf5uX8SegpA95BB7PH5e.Uj1VI7NMQw1j73KxLu';
const password = 'password123';

bcrypt.compare(password, hashInDb, (err, result) => {
    console.log("Does 'password123' match the DB hash?", result);
});
