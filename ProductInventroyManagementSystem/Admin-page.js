$(document).ready(function () {

    let loggedAccount = JSON.parse(localStorage.getItem("logList")) || [];

    if (loggedAccount.length === 0) {
        window.location.href = "index.html";
        return;
    }

    let currentUser = loggedAccount[0];

    if (!window.location.pathname.includes(currentUser.role + "-page.html")) {
        window.location.href = currentUser.role + "-page.html";
    }

    // ====================== USER LOGIC ======================
    if (!localStorage.getItem("accounts")) {
        const defaultAdmin = new User(1, "NJ Cajada", "adminnj@gmail.com", "@Adminnj123", "Admin");
        localStorage.setItem("accounts", JSON.stringify([defaultAdmin]));
    }

    const logList = JSON.parse(localStorage.getItem("logList")) || [];

    if (currentUser) {
        $('#sideHeader').text(`${currentUser.name} (${currentUser.role})`);
    }

    $('#contentArea').html('');

    // ====================== DISPLAY USERS ======================
    function displayUsers() {
        const users = JSON.parse(localStorage.getItem("accounts")) || [];
        let html = '<table class="table table-striped table-bordered"><thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th></tr></thead><tbody>';
        if (users.length === 0) html += '<tr><td colspan="4" class="text-center">No users found</td></tr>';
        else users.forEach(u => html += `<tr><td>${u.id}</td><td>${u.name}</td><td>${u.email}</td><td>${u.role}</td></tr>`);
        html += '</tbody></table>';
        $('#contentArea').html(html);
    }

    $('#userListLink').click(function (e) {
        e.preventDefault();
        displayUsers();
        $('.nav-link').removeClass('active');
        $(this).addClass('active');
    });

    // ====================== DASHBOARD ======================
    $('#dashboardLink').click(function (e) {
        e.preventDefault();

        $('#contentArea').html(`
            <div id="dashboardContent" class="mt-4">
                <div class="row">
                    <div class="col-md-6 mb-4">
                        <canvas id="usersChart"></canvas>
                    </div>
                    <div class="col-md-6 mb-4">
                        <canvas id="productsChart"></canvas>
                    </div>
                    <div class="col-12 mb-4">
                        <canvas id="stockChart"></canvas>
                    </div>
                </div>
            </div>
        `);

        const accounts = JSON.parse(localStorage.getItem("accounts")) || [];
        const products = JSON.parse(localStorage.getItem("products")) || [];

        // Users by Role Pie Chart
        const roles = ["Admin", "Supplier", "Staff"];
        const usersByRole = roles.map(r => accounts.filter(a => a.role === r).length);

        new Chart(document.getElementById('usersChart'), {
            type: 'pie',
            data: { labels: roles, datasets: [{ label: 'Users by Role', data: usersByRole, backgroundColor: ['#007bff', '#28a745', '#ffc107'] }] }
        });

        // Products by Supplier Bar Chart
        const supplierNames = [...new Set(accounts.filter(a => a.role === "Supplier").map(s => s.name))];
        const productsBySupplier = supplierNames.map(sName =>
            products.filter(p => {
                const sup = accounts.find(a => a.id == p.supplierId);
                return sup && sup.name === sName;
            }).length
        );

        new Chart(document.getElementById('productsChart'), {
            type: 'bar',
            data: { labels: supplierNames, datasets: [{ label: 'Products by Supplier', data: productsBySupplier, backgroundColor: '#17a2b8' }] },
            options: { scales: { y: { beginAtZero: true } } }
        });

        // Product Stock Levels Line Chart
        const productNames = products.map(p => p.name);
        const stockLevels = products.map(p => p.stock);

        new Chart(document.getElementById('stockChart'), {
            type: 'line',
            data: { labels: productNames, datasets: [{ label: 'Stock Levels', data: stockLevels, borderColor: '#dc3545', backgroundColor: 'rgba(220,53,69,0.2)', fill: true, tension: 0.3 }] },
            options: { scales: { y: { beginAtZero: true } } }
        });

        $('.nav-link').removeClass('active');
        $(this).addClass('active');
    });

    // ====================== ADD USER ======================
    $('#addUserForm').submit(function (e) {
        e.preventDefault();

        const nameInput = $('#txt-full-name');
        const emailInput = $('#txt-email');
        const passwordInput = $('#txt-password');
        const roleInput = $('#user-role');

        const name = nameInput.val().trim();
        const email = emailInput.val().trim();
        const password = passwordInput.val().trim();
        const role = roleInput.val();

        $('.form-control, .form-select').removeClass('is-invalid');
        $('.error-msg').remove();

        let isValid = true;

        function showError(input, message) {
            input.addClass('is-invalid');

            const errorSpan = $('<span>')
                .addClass('text-danger small error-msg')
                .text(message);

            input.after(errorSpan);
        }

        if (!name) {
            showError(nameInput, 'Full name is required.');
            isValid = false;
        }

        const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!email) {
            showError(emailInput, 'Email is required.');
            isValid = false;
        } else if (!emailPattern.test(email)) {
            showError(emailInput, 'Enter a valid email address.');
            isValid = false;
        }

        if (!password) {
            showError(passwordInput, 'Password is required.');
            isValid = false;
        }

        if (!role) {
            showError(roleInput, 'Please select a role.');
            isValid = false;
        }

        if (!isValid) return;

        let accounts = JSON.parse(localStorage.getItem("accounts")) || [];

        if (accounts.some(acc => acc.email === email)) {
            showError(emailInput, 'Email already exists.');
            return;
        }

        const newId = accounts.length ? accounts[accounts.length - 1].id + 1 : 1;
        const newUser = new User(newId, name, email, password, role);

        accounts.push(newUser);
        localStorage.setItem("accounts", JSON.stringify(accounts));

        alert("User created successfully!");
        $('#addUserForm')[0].reset();
        $('#addUserModal').modal('hide');

        if ($('#contentArea table').length) displayUsers();
    });

    // ====================== DYNAMIC SUPPLIER DROPDOWN ======================
    function populateSupplierDropdown() {
        const accounts = JSON.parse(localStorage.getItem("accounts")) || [];
        const suppliers = accounts.filter(u => u.role === "Supplier");

        const select1 = $('#product-supplier');
        const select2 = $('#select-supplier');
        select1.empty(); select2.empty();

        if (suppliers.length === 0) {
            select1.append('<option value="">No suppliers available</option>');
            select2.append('<option value="">No suppliers available</option>');
        } else {
            suppliers.forEach(s => {
                select1.append(`<option value="${s.id}">${s.name}</option>`);
                select2.append(`<option value="${s.id}">${s.name}</option>`);
            });
        }
    }
    populateSupplierDropdown();


    // ====================== ADD PRODUCT ======================
    $('#addProductForm').submit(function (e) {
        e.preventDefault();

        const nameInput = $('#product-name');
        const descInput = $('#product-description');
        const purchaseInput = $('#product-unit-price');
        const sellingInput = $('#product-selling-price');
        const stockInput = $('#product-stocks');

        const name = nameInput.val().trim();
        const description = descInput.val().trim();
        const purchasePrice = parseFloat(purchaseInput.val());
        const sellingPrice = parseFloat(sellingInput.val());
        const stock = parseInt(stockInput.val());

        const supplier = "Admin";

        $('.form-control').removeClass('is-invalid');
        $('.error-msg').remove();

        let isValid = true;

        function showError(input, message) {
            input.addClass('is-invalid');
            const errorSpan = $('<span>')
                .addClass('text-danger small error-msg')
                .text(message);
            input.after(errorSpan);
        }

        if (!name) {
            showError(nameInput, 'Product name is required.');
            isValid = false;
        }

        if (!description) {
            showError(descInput, 'Description is required.');
            isValid = false;
        }

        if (isNaN(purchasePrice) || purchasePrice <= 0) {
            showError(purchaseInput, 'Enter a valid purchase price.');
            isValid = false;
        }

        if (isNaN(sellingPrice) || sellingPrice <= 0) {
            showError(sellingInput, 'Enter a valid selling price.');
            isValid = false;
        }

        if (!isNaN(purchasePrice) && !isNaN(sellingPrice) && sellingPrice < purchasePrice) {
            showError(sellingInput, 'Selling must be higher than purchase.');
            isValid = false;
        }

        if (isNaN(stock) || stock < 0) {
            showError(stockInput, 'Enter a valid stock.');
            isValid = false;
        }

        if (!isValid) return;

        let products = JSON.parse(localStorage.getItem("products")) || [];

        const newId = products.length ? products[products.length - 1].id + 1 : 1;

        const newProduct = new Product(
            newId,
            name,
            description,
            supplier,
            sellingPrice,
            purchasePrice,
            stock
        );

        products.push(newProduct);
        localStorage.setItem("products", JSON.stringify(products));

        alert("Product added successfully!");
        $('#addProductForm')[0].reset();
        $('#addProductModal').modal('hide');

        if ($('#contentArea table').length) displayProducts();
    });


    // ====================== DISPLAY PRODUCTS ======================
    function displayProducts() {
        let products = JSON.parse(localStorage.getItem("products")) || [];

        let html = `<table class="table table-striped table-bordered"><thead><tr>
            <th>ID</th>
            <th>Name</th>
            <th>Description</th>
            <th>Supplier</th>
            <th>Purchase Price</th>
            <th>Selling Price</th>
            <th>Stock</th>
        </tr></thead><tbody>`;

        if (products.length === 0) {
            html += `<tr><td colspan="7" class="text-center">No products found</td></tr>`;
        } else {
            products.forEach(p => {
                html += `<tr>
                    <td>${p.id}</td>
                    <td>${p.name}</td>
                    <td>${p.description}</td>
                    <td>${p.supplier || "Admin"}</td>
                    <td>${Number(p.purchasePrice).toFixed(2)}</td>
                    <td>${Number(p.sellingPrice).toFixed(2)}</td>
                    <td>${p.stock}</td>
                </tr>`;
            });
        }

        html += `</tbody></table>`;
        $('#contentArea').html(html);
    }

    $('#productListLink').click(function () {
        displayProducts();
        $('.nav-link').removeClass('active');
        $(this).addClass('active');
    });

    // ====================== DISPLAY PRODUCTS ======================
    function displayProducts() {
        let products = JSON.parse(localStorage.getItem("products")) || [];
        let accounts = JSON.parse(localStorage.getItem("accounts")) || [];

        let html = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h4 class="mb-0">All Products</h4>
            <span class="text-muted small">${products.length} product(s) total</span>
        </div>
        <div class="table-responsive">
        <table class="table table-bordered table-hover align-middle">
        <thead class="table-dark">
            <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Description</th>
                <th>Supplier</th>
                <th>Purchase Price</th>
                <th>Selling Price</th>
                <th>Stock</th>
            </tr>
        </thead>
        <tbody>`;

        if (products.length === 0) {
            html += `<tr><td colspan="8" class="text-center text-muted py-4">No products found. Add a product to get started.</td></tr>`;
        } else {
            products.forEach(p => {
                const supplier = accounts.find(a => a.id == p.supplierId);
                const supplierDisplay = supplier ? supplier.name
                    : (p.supplierId === "Admin" || !p.supplierId) ? 'Admin' : 'Unknown';
                html += `
                <tr>
                    <td><span class="text-muted">${p.id}</span></td>
                    <td><strong>${p.name}</strong></td>
                    <td><small class="text-muted">${p.description || '—'}</small></td>
                    <td>${supplierDisplay}</td>
                    <td>₱${parseFloat(p.purchasePrice).toFixed(2)}</td>
                    <td>₱${parseFloat(p.sellingPrice).toFixed(2)}</td>
                    <td>${p.stock}</td>
                </tr>`;
            });
        }

        html += `</tbody></table></div>`;
        $('#contentArea').html(html);
    }

    $('#inventoryLink').click(function (e) { e.preventDefault(); displayInventory(); $('.nav-link').removeClass('active'); $(this).addClass('active'); });

    // ====================== INVENTORY ======================
    function displayInventory() {
        const products = JSON.parse(localStorage.getItem("products")) || [];
        const accounts = JSON.parse(localStorage.getItem("accounts")) || [];

        const suppliers = accounts.filter(a => a.role === "Supplier");
        let supplierOptions = '<option value="">All Suppliers</option>';
        suppliers.forEach(s => { supplierOptions += `<option value="${s.id}">${s.name}</option>`; });

        let html = `
            <h4 class="mb-3">Inventory</h4>
            <div class="d-flex gap-2 mb-3 flex-wrap">
                <select id="invSupplierFilter" class="form-select" style="max-width:200px;">
                    ${supplierOptions}
                </select>
                <select id="invStockFilter" class="form-select" style="max-width:180px;">
                    <option value="">All Stock Levels</option>
                    <option value="In Stock">In Stock</option>
                    <option value="Low Stock">Low Stock</option>
                    <option value="Out of Stock">Out of Stock</option>
                </select>
            </div>
            <div class="table-responsive">
            <table class="table table-bordered table-striped">
            <thead class="table-dark">
                <tr><th>ID</th><th>Name</th><th>Supplier</th><th>Stock</th><th>Level</th><th>Action</th></tr>
            </thead>
            <tbody id="inventoryBody">`;

        if (products.length === 0) {
            html += '<tr><td colspan="6" class="text-center">No inventory data found</td></tr>';
        } else {
            products.forEach(p => {
                const supplier = accounts.find(a => a.id == p.supplierId);
                const supplierName = supplier ? supplier.name
                    : (p.supplierId === "Admin" || !p.supplierId) ? 'Admin' : 'Unknown';
                const supplierId = supplier ? supplier.id : "";
                let badge = 'bg-success', label = 'In Stock';
                if (p.stock <= 0) { badge = 'bg-danger'; label = 'Out of Stock'; }
                else if (p.stock <= 10) { badge = 'bg-warning text-dark'; label = 'Low Stock'; }

                const requestBtn = label !== 'In Stock' && p.supplierId !== "Admin"
                    ? `<button class="btn btn-sm btn-primary inventoryRequestBtn me-1"
                            data-name="${p.name}" data-supplier="${p.supplierId}">
                            <i class="bi bi-cart-plus me-1"></i>Request
                        </button>`
                    : '';

                html += `<tr data-supplier="${supplierId}" data-level="${label}">
                    <td>${p.id}</td>
                    <td>${p.name}</td>
                    <td>${supplierName}</td>
                    <td>${p.stock}</td>
                    <td><span class="badge ${badge}">${label}</span></td>
                    <td>
                        ${requestBtn}
                        <button class="btn btn-sm btn-danger inventoryDeleteBtn" data-id="${p.id}">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>`;
            });
        }
        html += '</tbody></table></div>';
        $('#contentArea').html(html);

        function filterInventory() {
            const supplierId = $('#invSupplierFilter').val();
            const level = $('#invStockFilter').val();
            $('#inventoryBody tr').each(function () {
                const rowSupplier = String($(this).data('supplier'));
                const rowLevel = $(this).data('level') || '';
                const matchSupplier = !supplierId || rowSupplier === supplierId;
                const matchLevel = !level || rowLevel === level;
                $(this).toggle(matchSupplier && matchLevel);
            });
        }
        $('#invSupplierFilter').on('change', filterInventory);
        $('#invStockFilter').on('change', filterInventory);
    }

    $(document).on('click', '.inventoryRequestBtn', function () {
        const productName = $(this).data('name');
        const supplierId = $(this).data('supplier');

        const supplierSelect = $('#select-supplier');
        const productSelect = $('#request-product-name');

        supplierSelect.empty().append('<option value="">Select Supplier</option>');
        const accounts = JSON.parse(localStorage.getItem("accounts")) || [];
        accounts.filter(a => a.role === "Supplier").forEach(s => {
            supplierSelect.append(`<option value="${s.id}">${s.name}</option>`);
        });
        supplierSelect.val(supplierId);

        productSelect.empty().append('<option value="">Select Product</option>');
        const supplierProducts = SupplierStockStorage.getProducts().filter(p => p.supplierId == supplierId);
        supplierProducts.forEach(p => {
            productSelect.append(`<option value="${p.name}" data-price="${p.price}" data-stock="${p.stock}">${p.name} (Stock: ${p.stock})</option>`);
        });
        productSelect.val(productName);

        const selected = productSelect.find(':selected');
        $('#request-unit-price').val(selected.data('price') || '');
        $('#request-stocks').val(1);

        inventoryPrefilled = true;
        const modal = new bootstrap.Modal(document.getElementById('requestStockModal'));
        modal.show();
    });

    $(document).on('click', '.inventoryDeleteBtn', function () {
        const id = parseInt($(this).data('id'));
        if (!confirm("Are you sure you want to delete this product from inventory?")) return;
        let products = JSON.parse(localStorage.getItem("products")) || [];
        products = products.filter(p => p.id !== id);
        localStorage.setItem("products", JSON.stringify(products));
        displayInventory();
    });

    $('#inventoryLink').click(function (e) { e.preventDefault(); displayInventory(); $('.nav-link').removeClass('active'); $(this).addClass('active'); });

    let inventoryPrefilled = false;

    // ====================== CART LOGIC ======================
    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    function updateCartBadge() {
        $('#cartCount').text(cart.reduce((sum, item) => sum + item.quantity, 0));
    }
    updateCartBadge();

    // ====================== LOAD SUPPLIERS & PRODUCTS ======================
    $('#requestStockModal').on('show.bs.modal', function () {
        if (inventoryPrefilled) {
            inventoryPrefilled = false; // consume the flag, don't reset
            return;
        }

        const accounts = JSON.parse(localStorage.getItem("accounts")) || [];
        const supplierSelect = $('#select-supplier');
        supplierSelect.empty().append('<option value="">Select Supplier</option>');

        accounts.filter(a => a.role === "Supplier").forEach(s => {
            supplierSelect.append(`<option value="${s.id}">${s.name}</option>`);
        });

        $('#request-product-name').empty().append('<option value="">Select Product</option>');
        $('#request-unit-price').val('');
        $('#request-stocks').val(1);
    });

    $('#select-supplier').change(function () {
        const supplierId = parseInt($(this).val());
        const productSelect = $('#request-product-name');
        productSelect.empty().append('<option value="">Select Product</option>');

        if (!supplierId) return;

        const products = SupplierStockStorage.getProducts().filter(p => p.supplierId === supplierId);

        products.forEach(p => {
            productSelect.append(`<option value="${p.name}" data-price="${p.price}" data-stock="${p.stock}">
            ${p.name} (Stock: ${p.stock})
        </option>`);
        });

        $('#request-unit-price').val('');
    });

    $('#request-product-name').change(function () {
        const price = $(this).find(':selected').data('price') || '';
        $('#request-unit-price').val(price);
    });

    // ====================== ADD TO CART ======================
    $('#adminRequestProductStockForm').submit(function (e) {
        e.preventDefault();

        const supplierId = parseInt($('#select-supplier').val());
        const productName = $('#request-product-name').val();
        const unitPrice = parseFloat($('#request-unit-price').val());
        const quantity = parseInt($('#request-stocks').val());

        if (!supplierId || !productName || isNaN(unitPrice) || isNaN(quantity) || quantity < 1) {
            alert("Please fill in all fields correctly.");
            return;
        }

        // Check stock
        const product = SupplierStockStorage.getProducts()
            .find(p => p.supplierId === supplierId && p.name === productName);
        const maxStock = product ? product.stock : Infinity;

        let finalQty = quantity;
        if (quantity > maxStock) {
            finalQty = maxStock;
            alert(`Quantity adjusted to available stock (${maxStock})`);
        }

        // Add or update cart
        const existingIndex = cart.findIndex(item => item.supplierId === supplierId && item.productName === productName);
        if (existingIndex !== -1) {
            cart[existingIndex].quantity += finalQty;
            if (cart[existingIndex].quantity > maxStock) cart[existingIndex].quantity = maxStock;
        } else {
            cart.push({ supplierId, productName, unitPrice, quantity: finalQty, AdminStatus: "Approved" });
        }

        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartBadge();
        alert("Added to cart!");
        $('#adminRequestProductStockForm')[0].reset();
        $('#requestStockModal').modal('hide');
    });

    // ====================== DISPLAY CART ======================
    $('#cart-link').click(function (e) {
        e.preventDefault();
        const currentUser = JSON.parse(localStorage.getItem("logList") || "[]").slice(-1)[0];
        let html = `<tr><td colspan="5"><strong>Requested by: ${currentUser ? currentUser.name : "Unknown"}</strong></td></tr>`;

        cart.forEach((item, index) => {
            html += `<tr>
            <td>${item.productName}</td>
            <td>₱${item.unitPrice.toFixed(2)}</td>
            <td>
                <div class="d-flex">
                    <button class="btn btn-sm btn-secondary me-1" onclick="changeQty(${index}, -1)">-</button>
                    <span class="mx-2">${item.quantity}</span>
                    <button class="btn btn-sm btn-secondary ms-1" onclick="changeQty(${index}, 1)">+</button>
                </div>
            </td>
            <td>₱${(item.unitPrice * item.quantity).toFixed(2)}</td>
            <td><button class="btn btn-sm btn-danger" onclick="removeCartItem(${index})">Remove</button></td>
        </tr>`;
        });

        $('#cartTable').html(html);
        const total = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
        $('#cartTotal').text(total.toFixed(2));
        $('#cartModal').modal('show');
    });

    // ====================== CHECKOUT ======================
    $('#checkoutBtn').click(function () {
        if (cart.length === 0) {
            alert("Cart is empty!");
            return;
        }

        const requests = JSON.parse(localStorage.getItem("requests")) || [];
        const logList = JSON.parse(localStorage.getItem("logList") || "[]");
        const currentUser = logList[logList.length - 1];

        const newRequest = {
            id: requests.length ? requests[requests.length - 1].id + 1 : 1,
            requestedBy: currentUser ? currentUser.name : "Unknown",
            requestedByRole: "Admin",
            date: new Date().toLocaleString(),
            items: cart.map(item => ({
                ...item,
                requestedByRole: "Admin",
                requestedBy: currentUser ? currentUser.name : "Unknown",
                status: "Approved"
            }))
        };

        requests.push(newRequest);
        localStorage.setItem("requests", JSON.stringify(requests));

        // Clear cart
        cart = [];
        localStorage.setItem("cart", JSON.stringify(cart));
        updateCartBadge();

        alert("Request sent to suppliers!");
        $('#cartModal').modal('hide');
    });

    // ====================== CART QUANTITY FUNCTIONS ======================
    window.changeQty = function (index, delta) {
        cart[index].quantity += delta;

        const supplierId = cart[index].supplierId;
        const productName = cart[index].productName;

        let productsArray = (JSON.parse(localStorage.getItem("supplierStockStorage")) || []).filter(p => p.supplierId === supplierId);
        const product = productsArray.find(p => p.name === productName);

        if (product && cart[index].quantity > product.stock) {
            cart[index].quantity = product.stock;
            alert(`Cannot exceed available stock (${product.stock})`);
        }

        if (cart[index].quantity <= 0) cart.splice(index, 1);

        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartBadge();
        $('#cart-link').click();
    }

    window.removeCartItem = function (index) {
        cart.splice(index, 1);
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartBadge();
        $('#cart-link').click();
    }

    // ====================== VIEW ADMIN REQUESTS ======================
    function displayRequests() {

        const requests = JSON.parse(localStorage.getItem("requests")) || [];
        const accounts = JSON.parse(localStorage.getItem("accounts")) || [];

        // Filter requests that have items requested by Admin
        let adminRequests = requests.filter(req => req.items.some(item => item.requestedByRole === "Admin"));

        if (adminRequests.length === 0) {
            $('#contentArea').html("<h4 class='mb-3'>My Requests</h4><p class='text-muted'>No admin requests yet.</p>");
            return;
        }

        let html = `<h4 class="mb-3">My Requests</h4>

                    <table class="table table-bordered table-striped">
                    <thead class="table-dark">
                        <tr>
                            <th>Request ID</th>
                            <th>Requested By</th>
                            <th>Supplier</th>
                            <th>Product</th>
                            <th>Price</th>
                            <th>Quantity</th>
                            <th>Total</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                    `;

        adminRequests.forEach(req => {
            req.items.forEach((item, index) => {
                const supplier = accounts.find(a => a.id == item.supplierId);
                const supplierName = supplier ? supplier.name : "Unknown";

                let statusText = item.status || "Approved";
                let statusColor = "green";
                if (statusText === "Out for Delivery") statusColor = "darkblue";
                else if (statusText === "Rejected") statusColor = "red";
                else if (statusText === "Delivered") statusColor = "darkgreen";

                let actionBtn = statusText === "Out for Delivery"
                    ? `<button class="btn btn-sm btn-primary completeDelivery" data-req="${req.id}" data-index="${index}">
                           <i class="bi bi-check2-circle me-1"></i>Complete
                       </button>`
                    : `<span class="text-muted fst-italic">No Action</span>`;

                html += `
            <tr>
                <td>${req.id}</td>
                <td>${req.requestedBy}</td>
                <td>${supplierName}</td>
                <td>${item.productName}</td>
                <td>₱${parseFloat(item.unitPrice).toFixed(2)}</td>
                <td>${item.quantity}</td>
                <td>₱${(item.unitPrice * item.quantity).toFixed(2)}</td>
                <td>${req.date}</td>
                <td style="color:${statusColor}"><strong>${statusText}</strong></td>
                <td>${actionBtn}</td>
            </tr>
            `;
            });
        });

        html += `</tbody></table>`;
        $('#contentArea').html(html);
    }

    $('#viewRequestsLink').click(function (e) {

        e.preventDefault();

        displayRequests();

        $('.nav-link').removeClass('active');
        $(this).addClass('active');

    });

    // ====================== VIEW STAFF REQUESTS ======================
    function displayStaffRequests() {

        const requests = JSON.parse(localStorage.getItem("requests")) || [];
        const accounts = JSON.parse(localStorage.getItem("accounts")) || [];

        // Filter requests that have items requested by Staff
        let staffRequests = requests.filter(req => req.items.some(item => item.requestedByRole === "Staff"));

        if (staffRequests.length === 0) {
            $('#contentArea').html("<h4 class='mb-3'>Staff Requests</h4><p class='text-muted'>No staff requests found.</p>");
            return;
        }

        let html = `<h4 class="mb-3">Staff Requests</h4>

                    <table class="table table-bordered table-striped">
                    <thead class="table-dark">
                        <tr>
                            <th>Request ID</th>
                            <th>Requested By</th>
                            <th>Supplier</th>
                            <th>Product</th>
                            <th>Price</th>
                            <th>Quantity</th>
                            <th>Total</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                    `;

        staffRequests.forEach(req => {
            req.items.forEach((item, index) => {
                const supplier = accounts.find(a => a.id == item.supplierId);
                const supplierName = supplier ? supplier.name : "Unknown";

                let statusText = item.status || "Pending";
                let statusColor = "orange";
                if (statusText === "Approved") statusColor = "green";
                else if (statusText === "Declined") statusColor = "red";
                else if (statusText === "Out for Delivery") statusColor = "darkblue";
                else if (statusText === "Rejected") statusColor = "red";
                else if (statusText === "Delivered") statusColor = "darkgreen";

                let isPending = statusText === "Pending" || statusText === "Pending Admin Approval";

                let actionButtons;
                if (isPending) {
                    actionButtons = `<button class="btn btn-sm btn-success me-1 approveStaffRequest" data-req="${req.id}" data-index="${index}">Approve</button>
                       <button class="btn btn-sm btn-danger declineStaffRequest" data-req="${req.id}" data-index="${index}">Decline</button>`;
                } else if (statusText === "Out for Delivery") {
                    actionButtons = `<button class="btn btn-sm btn-primary completeDelivery" data-req="${req.id}" data-index="${index}">
                           <i class="bi bi-check2-circle me-1"></i>Complete
                       </button>`;
                } else {
                    actionButtons = `<span class="text-muted fst-italic">No Action</span>`;
                }

                html += `
        <tr>
            <td>${req.id}</td>
            <td>${req.requestedBy}</td>
            <td>${supplierName}</td>
            <td>${item.productName}</td>
            <td>₱${parseFloat(item.unitPrice).toFixed(2)}</td>
            <td>${item.quantity}</td>
            <td>₱${(item.unitPrice * item.quantity).toFixed(2)}</td>
            <td>${req.date}</td>
            <td style="color:${statusColor}"><strong>${statusText}</strong></td>
            <td>${actionButtons}</td>
        </tr>
        `;
            });
        });

        html += `</tbody></table>`;
        $('#contentArea').html(html);
    }

    $('#viewStaffRequestsLink').click(function (e) {
        e.preventDefault();
        displayStaffRequests();
        $('.nav-link').removeClass('active');
        $(this).addClass('active');
    });

    $(document).on("click", ".approveStaffRequest", function () {
        const requestId = parseInt($(this).data("req"));
        const itemIndex = parseInt($(this).data("index"));
        let requests = JSON.parse(localStorage.getItem("requests")) || [];
        let request = requests.find(r => r.id === requestId);
        if (request) {
            request.items[itemIndex].status = "Approved";
        }
        localStorage.setItem("requests", JSON.stringify(requests));
        displayStaffRequests();
    });

    $(document).on("click", ".declineStaffRequest", function () {
        const requestId = parseInt($(this).data("req"));
        const itemIndex = parseInt($(this).data("index"));
        let requests = JSON.parse(localStorage.getItem("requests")) || [];
        let request = requests.find(r => r.id === requestId);
        if (request) {
            request.items[itemIndex].status = "Declined"; // set on the specific item
        }
        localStorage.setItem("requests", JSON.stringify(requests));
        displayStaffRequests(); // refresh table
    });

    // ====================== COMPLETE DELIVERY ======================
    $(document).on("click", ".completeDelivery", function () {

        const requestId = parseInt($(this).data("req"));
        const itemIndex = parseInt($(this).data("index"));

        let requests = JSON.parse(localStorage.getItem("requests")) || [];
        let products = JSON.parse(localStorage.getItem("products")) || [];

        let request = requests.find(r => r.id === requestId);

        if (request) {

            let item = request.items[itemIndex];

            item.status = "Delivered";

            let product = products.find(p =>
                p.name === item.productName &&
                p.supplierId == item.supplierId
            );

            if (product) {
                product.stock += item.quantity;
            } else {
                let newId = products.length ? products[products.length - 1].id + 1 : 1;
                products.push({
                    id: newId,
                    name: item.productName,
                    description: "Auto-added from delivery",
                    supplierId: item.supplierId,
                    purchasePrice: item.unitPrice,
                    sellingPrice: item.unitPrice * 1.2,
                    stock: item.quantity
                });
            }

            let supplierProducts = JSON.parse(localStorage.getItem("supplierProducts")) || [];
            let supplierProduct = supplierProducts.find(p =>
                p.name === item.productName &&
                p.supplierId == item.supplierId
            );
            if (supplierProduct) {
                supplierProduct.stock = Math.max(0, supplierProduct.stock - item.quantity);
                localStorage.setItem("supplierProducts", JSON.stringify(supplierProducts));
            }
        }

        localStorage.setItem("requests", JSON.stringify(requests));
        localStorage.setItem("products", JSON.stringify(products));

        if ($('#contentArea h4').text().trim() === "My Requests") {
            displayRequests();
        } else {
            displayStaffRequests();
        }

    });

    // ====================== TRANSACTION HISTORY ======================
    function displayTransactionHistory() {
        const requests = JSON.parse(localStorage.getItem("requests")) || [];
        const accounts = JSON.parse(localStorage.getItem("accounts")) || [];

        let transactions = [];
        requests.forEach(req => {
            req.items.forEach(item => {
                if (item.status === "Delivered" || item.status === "Rejected") {
                    transactions.push({ req, item });
                }
            });
        });

        const delivered = transactions.filter(t => t.item.status === "Delivered");
        const totalValue = delivered.reduce((sum, t) => sum + (t.item.unitPrice * t.item.quantity), 0);
        const totalItems = delivered.reduce((sum, t) => sum + t.item.quantity, 0);
        const totalDelivered = delivered.length;

        let html = `
        <h4 class="mb-3">Transaction History</h4>

        <div class="row g-3 mb-4">
            <div class="col-sm-4">
                <div class="card border-0 shadow-sm text-center p-3">
                    <div class="fs-2 fw-bold text-success">${totalDelivered}</div>
                    <div class="text-muted small">Completed Transactions</div>
                </div>
            </div>
            <div class="col-sm-4">
                <div class="card border-0 shadow-sm text-center p-3">
                    <div class="fs-2 fw-bold text-primary">${totalItems}</div>
                    <div class="text-muted small">Total Units Delivered</div>
                </div>
            </div>
            <div class="col-sm-4">
                <div class="card border-0 shadow-sm text-center p-3">
                    <div class="fs-2 fw-bold text-warning">₱${totalValue.toFixed(2)}</div>
                    <div class="text-muted small">Total Value</div>
                </div>
            </div>
        </div>

        <div class="d-flex gap-2 mb-3 flex-wrap">
            <input type="text" id="transactionSearch" class="form-control" style="max-width:260px;" placeholder="Search product, supplier or requester…">
            <select id="transactionStatusFilter" class="form-select" style="max-width:180px;">
                <option value="">All Statuses</option>
                <option value="Delivered">Delivered</option>
                <option value="Rejected">Rejected</option>
            </select>
            <select id="transactionRoleFilter" class="form-select" style="max-width:180px;">
                <option value="">All Roles</option>
                <option value="Admin">Admin</option>
                <option value="Staff">Staff</option>
            </select>
        </div>`;

        if (transactions.length === 0) {
            html += `<p class="text-muted">No transactions yet.</p>`;
            $('#contentArea').html(html);
            return;
        }

        html += `
        <div class="table-responsive">
        <table class="table table-bordered table-striped">
        <thead class="table-dark">
            <tr>
                <th>Request ID</th>
                <th>Requested By</th>
                <th>Role</th>
                <th>Supplier</th>
                <th>Product</th>
                <th>Unit Price</th>
                <th>Qty</th>
                <th>Total</th>
                <th>Date</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody id="transactionBody">`;

        transactions.forEach(({ req, item }) => {
            const supplier = accounts.find(a => a.id == item.supplierId);
            const supplierName = supplier ? supplier.name : "Unknown";
            const role = item.requestedByRole || req.requestedByRole || "—";
            const total = (item.unitPrice * item.quantity).toFixed(2);
            const statusColor = item.status === "Delivered" ? "darkgreen" : "red";

            html += `
            <tr data-product="${item.productName.toLowerCase()}"
                data-requester="${req.requestedBy.toLowerCase()}"
                data-supplier="${supplierName.toLowerCase()}"
                data-role="${role}"
                data-status="${item.status}">
                <td>${req.id}</td>
                <td>${req.requestedBy}</td>
                <td><span class="badge ${role === 'Admin' ? 'bg-primary' : 'bg-warning text-dark'}">${role}</span></td>
                <td>${supplierName}</td>
                <td>${item.productName}</td>
                <td>₱${parseFloat(item.unitPrice).toFixed(2)}</td>
                <td>${item.quantity}</td>
                <td><strong>₱${total}</strong></td>
                <td>${req.date}</td>
                <td style="color:${statusColor}"><strong>${item.status}</strong></td>
            </tr>`;
        });

        html += `</tbody></table></div>`;
        $('#contentArea').html(html);

        function filterTransaction() {
            const query = $('#transactionSearch').val().toLowerCase();
            const status = $('#transactionStatusFilter').val();
            const role = $('#transactionRoleFilter').val().toLowerCase();
            $('#transactionBody tr').each(function () {
                const product = $(this).data('product') || '';
                const requester = $(this).data('requester') || '';
                const supplier = $(this).data('supplier') || '';
                const rowRole = $(this).data('role') || '';
                const rowStatus = $(this).data('status') || '';
                const matchSearch = product.includes(query) || requester.includes(query) || supplier.includes(query);
                const matchStatus = !status || rowStatus === status;
                const matchRole = !role || rowRole.toLowerCase() === role;
                $(this).toggle(matchSearch && matchStatus && matchRole);
            });
        }
        $('#transactionSearch').on('input', filterTransaction);
        $('#transactionStatusFilter').on('change', filterTransaction);
        $('#transactionRoleFilter').on('change', filterTransaction);
    }

    $('#transactionHistoryLink').click(function (e) {
        e.preventDefault();
        displayTransactionHistory();
        $('.nav-link').removeClass('active');
        $(this).addClass('active');
    });

    // ====================== LOGOUT ======================
    $('#logOut').click(function (e) {

        e.preventDefault();

        const confirmLogout = confirm("Are you sure you want to logout?");

        if (confirmLogout) {
            localStorage.removeItem("logList");

            window.location.href = "index.html";
        }

    });
});