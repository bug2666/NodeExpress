import prisma from '../configs/prisma.js';


const formatCart = (cart) => {
    return {
        id: cart.id,
        user_id: cart.user_id,
        created_at: cart.created_at,
        updated_at: cart.updated_at
    };
};


const getOrCreateCartByUserId = async (userId) => {
    const existingCart = await prisma.carts.findUnique({
        where: {
            user_id: userId
        }
    });

    if (existingCart) {
        return formatCart(existingCart);
    }

    const newCart = await prisma.carts.create({
        data: {
            user_id: userId
        }
    });

    return formatCart(newCart);
};



const getCartItems = async (cartId) => {
    const items = await prisma.cart_items.findMany({
        where: {
            cart_id: cartId
        },
        orderBy: {
            id: 'desc'
        },
        include: {
            products: {
                include: {
                    product_images: {
                        orderBy: [
                            { sort_order: 'asc' },
                            { id: 'asc' }
                        ],
                        take: 1
                    }
                }
            },
            product_variants: true
        }
    });

    return items.map((item) => {
        const firstImage = item.products.product_images[0];
        const unitPrice = Number(item.unit_price);
        const subtotal = Number(item.quantity) * unitPrice;

        return {
            id: item.id,
            cartId: item.cart_id,
            productId: item.product_id,
            variantId: item.variant_id,
            quantity: item.quantity,
            unitPrice,
            subtotal,
            productName: item.products.name,
            size: item.product_variants.size,
            color: item.product_variants.color,
            imageUrl: firstImage?.image_url || null
        };
    });
};




const addOrIncreaseCartItem = async (cartId, productId, variantId, quantity) => {
    const variant = await prisma.product_variants.findUnique({
        where: {
            id: variantId
        }
    });

    if (!variant) {
        throw new Error('Biến thể sản phẩm không tồn tại');
    }

    if (variant.product_id !== productId) {
        throw new Error('variantId không thuộc productId');
    }

    const existingItem = await prisma.cart_items.findFirst({
        where: {
            cart_id: cartId,
            variant_id: variantId
        }
    });

    if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;

        if (newQuantity > variant.stock) {
            throw new Error('Số lượng vượt quá tồn kho');
        }

        await prisma.cart_items.update({
            where: {
                id: existingItem.id
            },
            data: {
                quantity: newQuantity,
                unit_price: variant.price
            }
        });

        return;
    }

    if (quantity > variant.stock) {
        throw new Error('Số lượng vượt quá tồn kho');
    }

    await prisma.cart_items.create({
        data: {
            cart_id: cartId,
            product_id: productId,
            variant_id: variantId,
            quantity,
            unit_price: variant.price
        }
    });
};

const updateCartItemQuantity = async (cartId, variantId, quantity) => {
    const variant = await prisma.product_variants.findUnique({
        where: {
            id: variantId
        }
    });

    if (!variant) {
        throw new Error('Biến thể sản phẩm không tồn tại');
    }

    if (quantity > variant.stock) {
        throw new Error('Số lượng vượt quá tồn kho');
    }

    const existingItem = await prisma.cart_items.findFirst({
        where: {
            cart_id: cartId,
            variant_id: variantId
        }
    });

    if (!existingItem) {
        return false;
    }

    await prisma.cart_items.update({
        where: {
            id: existingItem.id
        },
        data: {
            quantity,
            unit_price: variant.price
        }
    });

    return true;
};

const removeCartItem = async (cartId, variantId) => {
    const existingItem = await prisma.cart_items.findFirst({
        where: {
            cart_id: cartId,
            variant_id: variantId
        }
    });

    if (!existingItem) {
        return false;
    }

    await prisma.cart_items.delete({
        where: {
            id: existingItem.id
        }
    });

    return true;
};

export{
    getOrCreateCartByUserId,
    getCartItems,
    addOrIncreaseCartItem,
    updateCartItemQuantity,
    removeCartItem
};
