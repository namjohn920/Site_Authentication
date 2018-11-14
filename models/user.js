const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcryptjs');

const userSchema = new Schema({
    email: {
        type: String,
    },
    username: {
        type: String
    },
    password: {
        type: String
    }
}, {
    timestamps: {
        createdAt: 'createdAt',
        updatedAt: 'updatedAt'
    }
});

const User = mongoose.model('users', userSchema);
module.exports = User;
module.exports.hashPassword = async (password) => {
    try {
        const salt = await bcrypt.genSalt(10);
        return await bcrypt.hash(password, salt);
    }
    catch(error) {
        throw new Error('Hashing Failed', error);
    }
};

module.exports.comparePasswords = async (inputPassword, hashedPassword) =>{
    try {
        return bcrypt.compare(inputPassword, hashedPassword);
    } catch (error){
        throw new Error('Comparing Failed', error);
    }
}