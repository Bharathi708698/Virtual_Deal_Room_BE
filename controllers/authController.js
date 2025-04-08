const UserModel = require("../models/UserModel");
const {
  TokenCreation,
  PasswordDecrypt,
  PasswordEncrypt,
} = require("../utils/defaultFunction");

const RegisterController = async (req, res) => {
  try {
    let { name, email, password, role } = req.body;
    let hash = req.hash;

    const existingUser = await UserModel.findOne({ hash, email });
    if (existingUser)
      return res.status(400).json({ msg: "User already exists" });

    let { token, jwtSecret } = TokenCreation(hash, role);

    let hashedPassword = await PasswordEncrypt(password);

    const newUser = new UserModel({
      name,
      email,
      password: hashedPassword,
      hash,
      role,
      jwtSecret,
    });
    await newUser.save();

    return res
      .status(201)
      .json({ msg: "User registered successfully", value: { token } });
  } catch (err) {
    // console.log(`${err.message} >>>>>>>>>> Error in RegisterController`);
    return res
      .status(500)
      .json({ msg: "Something went wrong. Try after sometimes" });
  }
};

const LoginController = async (req, res) => {
  try {
    const { email, password } = req.body;

    let hash = req.hash;

    const user = await UserModel.findOne({ hash, email });
    if (!user) return res.status(400).json({ msg: "Invalid credentials" });

    const isMatch = PasswordDecrypt(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    let { token, jwtSecret } = TokenCreation(hash, user.role);

    user.jwtSecret = jwtSecret;

    await user.save();

    return res.status(200).json({ msg: "Login Success", value: { token } });
  } catch (err) {
    // console.log(`${err.message} >>>>>>>>> Error in LoginController`);
    return res
      .status(500)
      .json({ msg: "Something went wrong. Try after sometimes" });
  }
};

const LogoutController = async (req, res) => {
  try {
    let hash = req.user.hash;

    const user = await UserModel.findOne({ hash });
    if (!user) return res.status(400).json({ msg: "Invalid credentials" });

    user.jwtSecret = "";

    await user.save();

    return res.status(200).json({ msg: "Logged Out Successfully" });
  } catch (err) {
    // console.log(`${err.message} >>>>>>>>> Error in LogoutController`);
    return res
      .status(500)
      .json({ msg: "Something went wrong. Try after sometimes" });
  }
};

const ProfileController = async (req, res) => {
  try {
    let hash = req.user.hash;

    const user = await UserModel.findOne({ hash });
    if (!user) return res.status(400).json({ msg: "Invalid credentials" });

    let userDetails = {
      name: user.name,
      email: user.email
    }

    return res.status(200).json({ msg: "Success", value: userDetails });
  } catch (err) {
    // console.log(`${err.message} >>>>>>>>> Error in ProfileController`);
    return res
      .status(500)
      .json({ msg: "Something went wrong. Try after sometimes" });
  }
}

module.exports = {
  RegisterController,
  LoginController,
  LogoutController,
  ProfileController
};
