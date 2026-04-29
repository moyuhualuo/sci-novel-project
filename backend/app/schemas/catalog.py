from pydantic import BaseModel


class CategoryItem(BaseModel):
    id: int
    name: str
    description: str


class ProductItem(BaseModel):
    id: int
    sku: str
    name: str
    description: str
    price: float
    inventory: int
    featured: bool
    category: str


class CatalogResponse(BaseModel):
    categories: list[CategoryItem]
    products: list[ProductItem]

