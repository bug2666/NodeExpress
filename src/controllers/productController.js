const Product = require('../models/Product');

const getProducts = async (req, res) => {
  try {
    const products = await Product.findAll();
    return res.json(products);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getProductById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }

    return res.json(product);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const createProduct = async (req, res) => {
  try {
    const { name, description, categoryId, brandId, basePrice, isActive } = req.body;

    if (!name || !description || !categoryId || !brandId) {
      return res.status(400).json({ message: 'Thiếu dữ liệu bắt buộc' });
    }

    const newProduct = await Product.createProduct({
      name,
      description,
      categoryId: Number(categoryId),
      brandId: Number(brandId),
      basePrice: Number(basePrice ?? 0),
      isActive: isActive === undefined ? 1 : Number(Boolean(isActive))
    });

    return res.status(201).json(newProduct);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, description, categoryId, brandId, basePrice, isActive } = req.body;

    const updated = await Product.updateProduct(id, {
      name,
      description,
      categoryId: Number(categoryId),
      brandId: Number(brandId),
      basePrice: Number(basePrice),
      isActive: Number(Boolean(isActive))
    });

    if (!updated) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm để cập nhật' });
    }

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


const deleteProduct = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const deleted = await Product.deleteProduct(id);

    if (!deleted) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm để xóa' });
    }

    return res.json({ message: 'Xóa sản phẩm thành công' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};
