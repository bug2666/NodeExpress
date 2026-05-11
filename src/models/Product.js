const prisma = require('../configs/prisma');

const findAll = async () => {
  const products = await prisma.products.findMany({
    orderBy: {
      id: 'desc'
    },
    include: {
      categories: true, /* nối với bảng */
      brands: true,
      product_images: {
        orderBy: [
          { sort_order: 'asc' },
          { id: 'asc' }
        ],
        take: 1
      }
    }
  });

  return products.map((product) => {
    const firstImage = product.product_images[0];

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      basePrice: product.base_price,
      isActive: product.is_active ? 1 : 0,
      createdAt: product.created_at,
      updatedAt: product.updated_at,
      categoryId: product.categories.id,
      categoryName: product.categories.name,
      brandId: product.brands.id,
      brandName: product.brands.name,
      imageUrl: firstImage?.image_url || null
    };
  });
};


const findImagesByProductId = async (productId) => {
  const images = await prisma.product_images.findMany({
    where: {
      product_id: productId
    },
    orderBy: [
      { sort_order: 'asc' },
      { id: 'asc' }
    ]
  });
  return images.map((image) => {
    return {
      id: image.id,
      imageUrl: image.image_url,
      sortOrder: image.sort_order,
      createdAt: image.created_at
    };
  });
}


const findVariantsByProductId = async (productId) => {
  const variants = await prisma.product_variants.findMany({
    where: {
      product_id: productId
    },
    orderBy: [
      { size: 'asc' },
      { color: 'asc' }
    ]
  });

  return variants.map((variant) => {
    return {
      id: variant.id,
      productId: variant.product_id,
      size: variant.size,
      color: variant.color,
      stock: variant.stock,
      price: variant.price,
      sku: variant.sku,
      createdAt: variant.created_at,
      updatedAt: variant.updated_at
    };
  });

}


const findById = async (id) => {
  const product = await prisma.products.findUnique({
    where: {
      id
    },
    include: {
      categories: true,
      brands: true,
      product_images: {
        orderBy: [
          { sort_order: 'asc' },
          { id: 'asc' }
        ],
        take: 1
      }
    }
  });

  if (!product) {
    return null;
  }

  const firstImage = product.product_images[0];
  const images = await findImagesByProductId(id);
  const variants = await findVariantsByProductId(id);

  return {
    id: product.id,
    name: product.name,
    description: product.description,
    basePrice: product.base_price,
    isActive: product.is_active ? 1 : 0,
    createdAt: product.created_at,
    updatedAt: product.updated_at,
    categoryId: product.categories.id,
    categoryName: product.categories.name,
    brandId: product.brands.id,
    brandName: product.brands.name,
    imageUrl: firstImage?.image_url || null,
    images,
    variants
  };
};

const createProduct = async ({ name, description, categoryId, brandId, basePrice, isActive }) => {
  const product = await prisma.products.create({
    data: {
      name: name?.trim(),
      description,
      category_id: categoryId,
      brand_id: brandId,
      base_price: basePrice ?? 0,
      is_active: Boolean(isActive ?? 1)
    }
  });

  return findById(product.id);
};




const updateProduct = async (id, { name, description, categoryId, brandId, basePrice, isActive }) => {
  const existingProduct = await prisma.products.findUnique({
    where: {
      id
    }
  });

  if (!existingProduct) {
    return null;
  }

  await prisma.products.update({
    where: {
      id
    },
    data: {
      name: name?.trim(),
      description,
      category_id: categoryId,
      brand_id: brandId,
      base_price: basePrice,
      is_active: Boolean(isActive)
    }
  });

  return findById(id);
};


const deleteProduct = async (id) => {
  try {
    await prisma.products.delete({
      where: {
        id
      }
    });

    return true;
  } catch (error) {
    if (error.code === 'P2025') {
      return false;
    }

    throw error;
  }
};


module.exports = { findAll, findById, createProduct, updateProduct, deleteProduct };
