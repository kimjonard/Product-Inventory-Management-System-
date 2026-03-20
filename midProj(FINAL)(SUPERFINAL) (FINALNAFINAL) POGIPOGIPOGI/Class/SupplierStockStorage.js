class SupplierStockStorage {

static getProducts(){

return JSON.parse(localStorage.getItem("supplierProducts")) || []

}

static saveProducts(products){

localStorage.setItem("supplierProducts", JSON.stringify(products))

}

static addProduct(product){

let products = this.getProducts()

products.push(product)

this.saveProducts(products)

}

}