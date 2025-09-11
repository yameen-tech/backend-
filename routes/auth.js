const express = require("express");
const { login } = require("../controllers/authController");

const router = express.Router();

// Only login route needed now
router.post("/login", login);

module.exports = router;