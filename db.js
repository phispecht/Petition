const spicedPg = require("spiced-pg");

let db;
if (process.env.DATABASE_URL) {
    db = spicedPg(process.env.DATABASE_URL);
} else {
    const { user, pw } = require("./secrets.json");
    db = spicedPg(`postgres:${user}:${pw}@localhost:5432/signature`);
}

exports.register = (first, last, email, hashedPw) => {
    return db.query(
        `INSERT INTO users (first, last, email, password) VALUES ($1, $2, $3, $4) RETURNING *`,
        [first, last, email, hashedPw]
    );
};

exports.profileInsert = (id, age, city, homepage) => {
    return db.query(
        `INSERT INTO user_profiles (user_id, age, city, url) VALUES ($1, $2, $3, $4) RETURNING *`,
        [id, age, city, homepage]
    );
};

exports.loginSelectUser = (email) => {
    return db.query(`SELECT * FROM users WHERE email = $1`, [email]);
};

exports.loginSelectSignatures = (id) => {
    return db.query(`SELECT * FROM signatures WHERE user_id = $1`, [id]);
};

/* exports.petitionInsertSignatures = (signature, id) => {
    return db.query(
        `INSERT INTO signatures (signature, user_id) VALUES ($1, $2) RETURNING *`,
        [signature, id]
    );
}; */

exports.petitionInsertSignatures = (signature, id) => {
    return db.query(
        `INSERT INTO signatures (signature, user_id)
        VALUES ($1, $2)
        ON CONFLICT (user_id)
        DO UPDATE SET signature=$1`,
        [signature, id]
    );
};

exports.getDataUser = (userId) => {
    return db.query(
        `SELECT users.id, users.first, users.last, users.email, users.password,
        user_profiles.age, user_profiles.city, user_profiles.url 
        FROM users
        LEFT JOIN user_profiles
        ON users.id = user_profiles.user_id
        WHERE users.id = $1`,
        [userId]
    );
};

exports.thanksSelectSignatures = (id) => {
    return db.query(`SELECT signature FROM signatures WHERE user_id = $1`, [
        id,
    ]);
};

/* exports.signersSelectFromSignatures = () => {
    return db.query(`SELECT first, last FROM users`);
}; */

exports.signersSelectFromSignatures = () => {
    return db.query(`SELECT users.id, users.first, users.last,
    signatures.signature,
    user_profiles.age, user_profiles.city, user_profiles.url
    FROM users
    JOIN signatures
    ON users.id = signatures.user_id
    LEFT JOIN user_profiles
    ON users.id = user_profiles.user_id  
`);
};

exports.filterSigners = (cityName) => {
    return db.query(
        `SELECT users.id, users.first, users.last,
    signatures.signature,
    user_profiles.age, user_profiles.city, user_profiles.url
    FROM users
    JOIN signatures
    ON users.id = signatures.user_id
    LEFT JOIN user_profiles
    ON users.id = user_profiles.user_id WHERE LOWER(city) = LOWER($1)`,
        [cityName]
    );
};

exports.updateUserPassword = (
    idValue,
    firstValue,
    lastValue,
    emailValue,
    hashedPwValue
) => {
    return db.query(
        `UPDATE users SET first=$1, last=$2, email=$3, password=$4 WHERE id = $5`,
        [firstValue, lastValue, emailValue, hashedPwValue, idValue]
    );
};

exports.updateUser = (idValue, firstValue, lastValue, emailValue) => {
    return db.query(
        `UPDATE users SET first=$1, last=$2, email=$3 WHERE id = $4`,
        [firstValue, lastValue, emailValue, idValue]
    );
};

exports.updateUserProfile = (idValue, ageValue, cityValue, homepageValue) => {
    return db.query(
        `
        INSERT INTO user_profiles (user_id, age, city, url)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id)
        DO UPDATE SET age=$2, city=$3, url=$4`,
        [idValue, ageValue, cityValue, homepageValue]
    );
};

exports.deleteSignature = (id) => {
    return db.query(`DELETE FROM signatures WHERE id = $1`, [id]);
};
