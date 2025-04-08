const UserModel = require("../models/UserModel");
const {
  NameCheck,
  EmailCheck,
  PasswordCheck,
  HashCreation,
  TokenDecode,
  TokenVerification,
} = require("../utils/defaultFunction");

const AuthenticationMiddleware = async (req, res, next) => {
 try {
  let { name, email, password, role, cmd } = req.body;

  cmd = cmd.toLowerCase();
  if (cmd == "register") {
    role = role.toLowerCase();
    let Role = ["buyer", "seller"];
    if (!name || !email || !password || !Role.includes(role)) {
      return res.status(400).json({ msg: "Bad Request" });
    }
    req.body.role = role;

    name = name.length > 30 ? name.slice(0, 30) : name;
    email = email.length > 50 ? email.slice(0, 50) : email;
    password = password.length > 20 ? email.slice(0, 30) : password;

    if (!NameCheck(name) || !EmailCheck(email) || !PasswordCheck(password)) {
      return res.status(400).json({ msg: "Bad Request" });
    }
    req.hash = HashCreation(email);
    // console.log(req.hash, "Register AuthenticationMiddleware");
    next();
  } else if (cmd === "login") {
    if (!email || !password) {
      return res.status(400).json({ msg: "Bad Request" });
    }

    email = email.length > 50 ? email.slice(0, 50) : email;
    password = password.length > 20 ? email.slice(0, 30) : password;

    if (!EmailCheck(email) || !PasswordCheck(password)) {
      return res.status(400).json({ msg: "Bad Request" });
    }
    req.hash = HashCreation(email);
    // console.log(req.hash, "login AuthenticationMiddleware");
    next();
  } else {
    return res.status(400).json({ msg: "Invalid Data" });
  }
 } catch (error) {
  return res.status(500).json({msg: "Something went wrong. Try after sometimes"})
}
};

const AuthorizationMiddleware = async (req, res, next) => {
  try {
    // console.log(req.method, req.originalUrl);
    let token = req.headers.authorization;

    if(!token) {
      return res.status(401).json({msg: "Unauthorized"});
    };

    token = token.split(" ")[1];

    // console.log(token, "token");
    
    let decode = TokenDecode(token);
    // console.log(decode, "Decode in Authorization middleware");
    
    if(!decode?.id){
      return res.status(401).json({msg: "Unauthorized"});
    }

    let user = await UserModel.findOne({hash: decode.id});

    // console.log(user, "LIne 77 user in Authorization middleware")

    if(!user || user.jwtSecret === "") {
      return res.status(401).json({msg: "Unauthorized"});
    };

    let jwtVerify = TokenVerification({token, jwtSecret: user.jwtSecret });

    if(!jwtVerify){
      return res.status(401).json({msg: "Unauthorized"});
    }

    if(req.path === "/auth"){
      return res.status(200).json({value: {role: user.role, name: user.name}});
    }

    req.user = user;
    next();
    
  } catch (error) {
  return res.status(500).json({msg: "Something went wrong. Try after sometimes"})
  }
}

module.exports = {
  AuthenticationMiddleware,
  AuthorizationMiddleware
};
