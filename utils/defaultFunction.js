const crypto = require("crypto");
let jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

module.exports.HashCreation = (email) => {
  return crypto
    .createHash("sha256")
    .update("" + email)
    .digest("hex");
};

module.exports.NameCheck = (name) => {
  return /^[A-Za-z0-9]+(?: [A-Za-z0-9]+){0,2}$/.test(name);
};

module.exports.EmailCheck = (email) => {
  return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.(com|in|co)$/.test(email);
};

module.exports.PasswordCheck = (password) => {
  return /^[A-Za-z0-9@#$%^&+=!]{6,15}$/.test(password);
};

module.exports.TokenCreation = (hash, role) => {
  const jwtSecret = crypto.randomBytes(64).toString("hex");

  const token = jwt.sign(
    { id: hash, role: role },
    jwtSecret
    // { expiresIn: "1h" }
  );

  return { jwtSecret, token };
};

module.exports.TokenVerification = ({ token, jwtSecret }) => {
  try {
    jwt.verify(token, jwtSecret);
    return true;
  } catch (error) {
    return false;
  }
};

module.exports.TokenDecode = (token) => {
  return jwt.decode(token);
};

module.exports.PasswordEncrypt = async (password) => {
  // console.log(
  //   password,
  //   process.env.BCRYPT_HASH,
  //   typeof process.env.BCRYPT_HASH,
  //   "Line 37"
  // );
  return await bcrypt.hash(password, Number(process.env.BCRYPT_HASH));
};

module.exports.PasswordDecrypt = async (password, dbPassword) => {
  return await bcrypt.compare(password, dbPassword);
};
