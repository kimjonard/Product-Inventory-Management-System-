class ProductStorage {
    constructor() {
        this.products = JSON.parse(localStorage.getItem("products")) || [];
    }

    addProduct(product) {
        this.products.push(product);
        localStorage.setItem("products", JSON.stringify(this.products));
    }

    getProducts() {
        return this.products;
    }
}