const bcrypt = require("bcryptjs");

const registerUser = async (req, res) => {
    const { firstName, lastName, email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    res.status(200).json({
        firstName,
        lastName,
        email,
        hashedPassword,
    });
};

module.exports = {
    registerUser,
};
