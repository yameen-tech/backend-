const express = require("express");
const { createCategory, getCategories } = require("../controllers/categoryController");
const auth = require("../middlewares/auth");

const router = express.Router();

router.post("/", auth, createCategory);
router.get("/", getCategories);

module.exports = router;
