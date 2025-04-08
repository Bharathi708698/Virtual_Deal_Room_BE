const mongoose = require("mongoose");

const ConnectionDB = () => {
    try {
        const UserDB = mongoose.createConnection(process.env.MONGO_URI);
    return {UserDB}
    } catch (error) {
        console.log(`${error.message} >>>>>> Error from Config database.js`);
    }
};


module.exports = ConnectionDB();