const jwt = require("jsonwebtoken");

// Dummy admin credentials
const ADMIN_CREDENTIALS = {
  email: "admin@noorfabrics.com",
  password: "admin123",
  name: "Admin User",
  role: "admin"
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Check against dummy admin credentials
    if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
      const token = jwt.sign(
        { 
          id: "admin_id", 
          email: ADMIN_CREDENTIALS.email,
          role: ADMIN_CREDENTIALS.role 
        }, 
        process.env.JWT_SECRET, 
        { expiresIn: "24h" }
      );

      res.json({ 
        token, 
        user: {
          name: ADMIN_CREDENTIALS.name,
          email: ADMIN_CREDENTIALS.email,
          role: ADMIN_CREDENTIALS.role
        }
      });
    } else {
      return res.status(400).json({ message: "Invalid credentials" });
    }
  } catch (err) {
    next(err);
  }
};

// Remove the register function since we don't need it anymore