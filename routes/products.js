const express = require("express");
const { 
  createProduct, 
  getProducts, 
  getProduct, 
  updateProduct, 
  deleteProduct  // Make sure this is imported
} = require("../controllers/productController");
const auth = require("../middlewares/auth");
const upload = require("../middlewares/upload");

const router = express.Router();

router.post("/", auth, upload.array('images', 3), createProduct);
router.get("/", getProducts);
router.get("/:id", getProduct);
router.put("/:id", auth, upload.array('images', 3), updateProduct);
router.delete("/:id", auth, deleteProduct); // This is the missing endpoint!

module.exports = router;