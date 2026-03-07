const bcrypt = require('bcrypt');
const password = 'password123';
bcrypt.hash(password, 10, (err, hash) => {
    console.log("Hash for 'password123':", hash);
});
