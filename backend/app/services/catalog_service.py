from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.catalog import Category, Product
from app.schemas.catalog import CatalogResponse, CategoryItem, ProductItem


async def build_catalog(db: AsyncSession) -> CatalogResponse:
    categories_result = await db.execute(select(Category).order_by(Category.name))
    products_result = await db.execute(select(Product, Category.name).join(Category).order_by(Product.featured.desc()))

    categories = [
        CategoryItem(id=category.id, name=category.name, description=category.description)
        for category in categories_result.scalars().all()
    ]
    products = [
        ProductItem(
            id=product.id,
            sku=product.sku,
            name=product.name,
            description=product.description,
            price=product.price,
            inventory=product.inventory,
            featured=product.featured,
            category=category_name,
        )
        for product, category_name in products_result.all()
    ]
    return CatalogResponse(categories=categories, products=products)

