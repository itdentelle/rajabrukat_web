import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { clearCacheByPattern } from '../middlewares/cache.middleware';

export const getProducts = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const all = req.query.all === 'true';
    const limit = req.query.limit ? parseInt(req.query.limit as string) : all ? 1000 : 24;
    const minimal = req.query.minimal === 'true';
    const skip = (page - 1) * limit;

    const whereClause: any = {};
    if (!all) {
      whereClause.isActive = true;
    }

    const selectClause = minimal
      ? {
          id: true,
          name: true,
          code: true,
          price: true,
          discountPrice: true,
          category: true,
          image: true,
          stock: true,
          isActive: true,
          createdAt: true,
        }
      : undefined;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: whereClause,
        select: selectClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where: whereClause }),
    ]);

    res.json({
      products,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

export const getCategories = async (req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: { category: true },
    });

    const categorySet = new Set<string>();
    categorySet.add('Grade A');
    categorySet.add('Grade B');
    categorySet.add('Tulle');

    products.forEach((p) => {
      if (p.category && p.category.trim()) {
        categorySet.add(p.category.trim());
      }
    });

    const categories = Array.from(categorySet).map((cat) => ({
      name: cat,
      href: `/collections/${encodeURIComponent(cat.toLowerCase().replace(/\s+/g, '-'))}`,
    }));

    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

export const searchProducts = async (req: Request, res: Response) => {
  try {
    const q = req.query.q as string;
    if (!q) return res.json({ products: [], meta: { total: 0 } });

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { code: { contains: q, mode: 'insensitive' } },
          { category: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: 20,
    });

    res.json({
      products,
      meta: { total: products.length },
    });
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({ error: 'Failed to search products' });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const {
      name,
      code,
      price,
      discountPrice,
      category,
      description,
      image,
      galleryImages,
      colors,
      sizeGuide,
      stock,
      colorStocks,
      colorImages,
    } = req.body;

    let computedStock = stock !== undefined ? Number(stock) : 100;
    let parsedColorStocks = colorStocks && typeof colorStocks === 'object' ? colorStocks : null;
    let parsedColorImages = colorImages && typeof colorImages === 'object' ? colorImages : null;

    if (parsedColorStocks && Object.keys(parsedColorStocks).length > 0) {
      computedStock = Object.values(parsedColorStocks).reduce(
        (sum: number, val: any) => sum + (Number(val) || 0),
        0
      );
    }

    const product = await prisma.product.create({
      data: {
        name,
        code: code && typeof code === 'string' ? code.trim().toUpperCase() : undefined,
        price: Number(price),
        discountPrice: discountPrice ? Number(discountPrice) : null,
        category,
        description,
        image,
        galleryImages: galleryImages || [],
        colors: colors || [],
        colorStocks: parsedColorStocks ? parsedColorStocks : undefined,
        colorImages: parsedColorImages ? parsedColorImages : undefined,
        sizeGuide,
        stock: computedStock,
      },
    });

    await clearCacheByPattern('cache:/api/products*');
    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const {
      name,
      code,
      price,
      discountPrice,
      category,
      description,
      image,
      galleryImages,
      colors,
      sizeGuide,
      stock,
      colorStocks,
      colorImages,
    } = req.body;

    let parsedColorStocks = colorStocks && typeof colorStocks === 'object' ? colorStocks : undefined;
    let parsedColorImages = colorImages && typeof colorImages === 'object' ? colorImages : undefined;
    let computedStock = stock !== undefined ? Number(stock) : undefined;

    if (parsedColorStocks && Object.keys(parsedColorStocks).length > 0) {
      computedStock = Object.values(parsedColorStocks).reduce(
        (sum: number, val: any) => sum + (Number(val) || 0),
        0
      );
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        code:
          code !== undefined
            ? code && typeof code === 'string'
              ? code.trim().toUpperCase()
              : null
            : undefined,
        price: Number(price),
        discountPrice: discountPrice ? Number(discountPrice) : null,
        category,
        description,
        image,
        galleryImages: galleryImages || [],
        colors: colors || [],
        colorStocks: parsedColorStocks,
        colorImages: parsedColorImages,
        sizeGuide,
        stock: computedStock,
      },
    });

    await clearCacheByPattern('cache:/api/products*');
    res.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const isHardDelete = req.query.force === 'true';

    if (isHardDelete) {
      await prisma.cartItem.deleteMany({ where: { productId: id } });
      await prisma.wishlistItem.deleteMany({ where: { productId: id } });
      await prisma.review.deleteMany({ where: { productId: id } });
      await prisma.orderItem.deleteMany({ where: { productId: id } });
      await prisma.product.delete({ where: { id } });

      await clearCacheByPattern('cache:/api/products*');
      return res.json({ message: 'Product permanently deleted' });
    }

    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    await clearCacheByPattern('cache:/api/products*');
    res.json({ message: 'Product archived successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
};

export const restoreProduct = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.product.update({
      where: { id },
      data: { isActive: true },
    });

    await clearCacheByPattern('cache:/api/products*');
    res.json({ message: 'Product restored successfully' });
  } catch (error) {
    console.error('Error restoring product:', error);
    res.status(500).json({ error: 'Failed to restore product' });
  }
};

export const updateProductStock = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { stock, colorStocks, color } = req.body;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Produk tidak ditemukan' });

    let updatedColorStocks: any =
      existing.colorStocks && typeof existing.colorStocks === 'object'
        ? { ...(existing.colorStocks as object) }
        : {};
    let newTotalStock = existing.stock;

    if (color && stock !== undefined) {
      updatedColorStocks[color] = Math.max(0, Math.floor(Number(stock)));
      newTotalStock = Object.values(updatedColorStocks).reduce(
        (sum: number, v: any) => sum + (Number(v) || 0),
        0
      );
    } else if (colorStocks && typeof colorStocks === 'object') {
      updatedColorStocks = colorStocks;
      newTotalStock = Object.values(colorStocks).reduce(
        (sum: number, v: any) => sum + (Number(v) || 0),
        0
      );
    } else if (stock !== undefined) {
      newTotalStock = Math.max(0, Math.floor(Number(stock)));
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        stock: newTotalStock,
        colorStocks: Object.keys(updatedColorStocks).length > 0 ? updatedColorStocks : undefined,
      },
    });

    await clearCacheByPattern('cache:/api/products*');
    res.json(product);
  } catch (error) {
    console.error('Error updating product stock:', error);
    res.status(500).json({ error: 'Gagal memperbarui stok produk' });
  }
};
