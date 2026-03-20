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

    const logList = JSON.parse(localStorage.getItem("logList")) || [];

    if (currentUser) {
        $('#sideHeader').text(`${currentUser.name} (${currentUser.role})`);
    }

    $('#contentArea').html('');

    // ====================== DISPLAY USERS ======================
    function displayUsers() {
        const users = JSON.parse(localStorage.getItem("accounts")) || [];
        let html = '<table class="table table-striped"><thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th></tr></thead><tbody>';
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
                        <canvas id="productsChart"></canvas>
                    </div>
                    <div class="col-md-6 mb-4">
                        <canvas id="stockChart"></canvas>
                    </div>
                </div>
            </div>
        `);

        const products = JSON.parse(localStorage.getItem("products")) || [];

        const productNames = products.map(p => p.name);
        const stockLevels = products.map(p => p.stock);

        new Chart(document.getElementById('productsChart'), {
            type: 'bar',
            data: {
                labels: productNames,
                datasets: [{
                    label: 'Products',
                    data: stockLevels,
                    backgroundColor: '#17a2b8'
                }]
            }
        });

        new Chart(document.getElementById('stockChart'), {
            type: 'line',
            data: {
                labels: productNames,
                datasets: [{
                    label: 'Stock Levels',
                    data: stockLevels,
                    borderColor: '#dc3545',
                    backgroundColor: 'rgba(220,53,69,0.2)',
                    fill: true
                }]
            }
        });

        $('.nav-link').removeClass('active');
        $(this).addClass('active');

    });

    // ====================== SUPPLIER DROPDOWN ======================
    function populateSupplierDropdown() {
        const accounts = JSON.parse(localStorage.getItem("accounts")) || [];
        const suppliers = accounts.filter(u => u.role === "Supplier");
        const select = $('#select-supplier');
        select.empty().append('<option value="">Select Supplier</option>');
        if (suppliers.length === 0) {
            select.append('<option value="">No suppliers available</option>');
        } else {
            suppliers.forEach(s => select.append(`<option value="${s.id}">${s.name}</option>`));
        }
        $('#request-product-name').empty().append('<option value="">Select Product</option>');
        $('#request-unit-price').val('');
    }

    populateSupplierDropdown();

    $('#requestStockModal').on('show.bs.modal', function () {
        populateSupplierDropdown();
        $('#request-stocks').val(1);
    });

    $(document).on('change', '#select-supplier', function () {
        const supplierId = parseInt($(this).val());
        const productSelect = $('#request-product-name');
        productSelect.empty().append('<option value="">Select Product</option>');
        $('#request-unit-price').val('');
        if (!supplierId) return;
        const products = SupplierStockStorage.getProducts().filter(p => p.supplierId === supplierId);
        products.forEach(p => {
            productSelect.append(`<option value="${p.name}" data-price="${p.price}" data-stock="${p.stock}">${p.name} (Stock: ${p.stock})</option>`);
        });
    });

    $(document).on('change', '#request-product-name', function () {
        const price = $(this).find(':selected').data('price') || '';
        $('#request-unit-price').val(price);
    });

    // ====================== CART ======================

    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    function updateCartBadge() {
        $('#cartCount').text(cart.reduce((sum, item) => sum + item.quantity, 0));
    }

    updateCartBadge();

    // ====================== STAFF REQUEST ======================
    $('#staffRequestProductStockForm').submit(function (e) {
        e.preventDefault();

        const supplierId = parseInt($('#select-supplier').val());
        const productName = $('#request-product-name').val();
        const unitPrice = parseFloat($('#request-unit-price').val());
        const quantity = parseInt($('#request-stocks').val());

        if (!supplierId || !productName || isNaN(unitPrice) || isNaN(quantity) || quantity < 1) {
            alert("Please fill in all fields correctly.");
            return;
        }

        const product = SupplierStockStorage.getProducts()
            .find(p => p.supplierId === supplierId && p.name === productName);
        const maxStock = product ? product.stock : Infinity;

        let finalQty = quantity;
        if (quantity > maxStock) {
            finalQty = maxStock;
            alert(`Quantity adjusted to available stock (${maxStock})`);
        }

        const existingIndex = cart.findIndex(item => item.supplierId === supplierId && item.productName === productName);
        if (existingIndex !== -1) {
            cart[existingIndex].quantity += finalQty;
            if (cart[existingIndex].quantity > maxStock) cart[existingIndex].quantity = maxStock;
        } else {
            cart.push({
                supplierId,
                productName,
                unitPrice,
                quantity: finalQty,
                status: "Pending Admin Approval",
                requestedByRole: "Staff",
                requestedBy: currentUser ? currentUser.name : "Unknown"
            });
        }

        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartBadge();
        alert("Request added to cart!");
        $('#staffRequestProductStockForm')[0].reset();
        $('#request-product-name').empty().append('<option value="">Select Product</option>');
        $('#request-unit-price').val('');
        $('#requestStockModal').modal('hide');
    });

    // ====================== CHECKOUT ======================
    $('#checkoutBtn').click(function () {
        if (cart.length === 0) { alert("Cart is empty!"); return; }

        let requests = JSON.parse(localStorage.getItem("requests")) || [];

        const newRequest = {
            id: requests.length ? requests[requests.length - 1].id + 1 : 1,
            requestedBy: currentUser ? currentUser.name : "Unknown",
            requestedByRole: "Staff",
            date: new Date().toLocaleString(),
            items: cart.map(item => ({
                ...item,
                status: "Pending Admin Approval",
                requestedByRole: "Staff",
                requestedBy: currentUser ? currentUser.name : "Unknown"
            }))
        };

        requests.push(newRequest);
        localStorage.setItem("requests", JSON.stringify(requests));

        cart = [];
        localStorage.setItem("cart", JSON.stringify(cart));
        updateCartBadge();

        alert("Request sent to Admin for approval!");
        $('#cartModal').modal('hide');
    });

    $('#cart-link').click(function (e) {
        e.preventDefault();

        let html = '';

        cart.forEach((item, index) => {
            html += `
        <tr>
            <td>${item.productName}</td>
            <td>₱${item.unitPrice.toFixed(2)}</td>
            <td>
                <div class="d-flex align-items-center">
                    <button class="btn btn-sm btn-secondary me-1" onclick="changeQty(${index}, -1)">-</button>
                    <span class="mx-2">${item.quantity}</span>
                    <button class="btn btn-sm btn-secondary ms-1" onclick="changeQty(${index}, 1)">+</button>
                </div>
            </td>
            <td>₱${(item.unitPrice * item.quantity).toFixed(2)}</td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="removeCartItem(${index})">Remove</button>
            </td>
        </tr>
        `;
        });

        $('#cartTable').html(html);

        const total = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
        $('#cartTotal').text(total.toFixed(2));

        $('#cartModal').modal('show');
    });


    // ====================== VIEW REQUESTS ======================

    function displayRequests() {

        const requests = JSON.parse(localStorage.getItem("requests")) || [];
        const accounts = JSON.parse(localStorage.getItem("accounts")) || [];

        // Only show staff members requests
        const myRequests = requests.filter(req =>
            req.requestedByRole === "Staff" &&
            req.requestedBy === (currentUser ? currentUser.name : "")
        );

        if (myRequests.length === 0) {
            $('#contentArea').html("<h4 class='mb-3'>My Requests</h4><p class='text-muted'>You have no requests yet.</p>");
            return;
        }

        let html = `<h4 class="mb-3">My Requests</h4>

                    <table class="table table-bordered table-striped">
                    <thead class="table-dark">
                        <tr>
                            <th>Request ID</th>
                            <th>Supplier</th>
                            <th>Product</th>
                            <th>Price</th>
                            <th>Quantity</th>
                            <th>Total</th>
                            <th>Date</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                    `;

        myRequests.forEach(req => {
            req.items.forEach(item => {
                const supplier = accounts.find(a => a.id == item.supplierId);
                const supplierName = supplier ? supplier.name : "Unknown";

                let statusText = item.status || "Pending Admin Approval";
                let statusColor = "orange";
                if (statusText === "Approved") statusColor = "green";
                else if (statusText === "Declined") statusColor = "red";
                else if (statusText === "Out for Delivery") statusColor = "darkblue";
                else if (statusText === "Rejected") statusColor = "red";
                else if (statusText === "Delivered") statusColor = "darkgreen";

                html += `
        <tr>
            <td>${req.id}</td>
            <td>${supplierName}</td>
            <td>${item.productName}</td>
            <td>₱${parseFloat(item.unitPrice).toFixed(2)}</td>
            <td>${item.quantity}</td>
            <td>₱${(item.unitPrice * item.quantity).toFixed(2)}</td>
            <td>${req.date}</td>
            <td style="color:${statusColor}"><strong>${statusText}</strong></td>
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

    // ====================== CART FUNCTIONS ======================

    window.changeQty = function (index, delta) {

        cart[index].quantity += delta;

        if (cart[index].quantity <= 0) {

            cart.splice(index, 1);

        }

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