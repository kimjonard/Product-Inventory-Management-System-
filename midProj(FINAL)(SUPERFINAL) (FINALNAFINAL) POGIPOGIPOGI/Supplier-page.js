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

    // ====================== DASHBOARD ======================
    $('#dashboardLink').click(function () {
        const requests = JSON.parse(localStorage.getItem("requests")) || [];
        const logList = JSON.parse(localStorage.getItem("logList")) || [];
        const supplierId = logList.length ? logList[0].id : null;

        let counts = { Approved: 0, "Out for Delivery": 0, Delivered: 0, Rejected: 0 };

        if (supplierId) {
            requests.forEach(req => {
                req.items.forEach(item => {
                    if (item.supplierId == supplierId && counts.hasOwnProperty(item.status)) {
                        counts[item.status]++;
                    }
                });
            });
        }

        const cards = [
            { label: "Approved", count: counts["Approved"], color: "#28a745", icon: "bi-check-circle-fill" },
            { label: "Out for Delivery", count: counts["Out for Delivery"], color: "#0d6efd", icon: "bi-truck" },
            { label: "Delivered", count: counts["Delivered"], color: "#198754", icon: "bi-box-seam" },
            { label: "Rejected", count: counts["Rejected"], color: "#dc3545", icon: "bi-x-circle-fill" }
        ];

        let html = `<h4 class="mb-4">Dashboard</h4><div class="row g-3">`;

        cards.forEach(c => {
            html += `
            <div class="col-sm-6 col-lg-3">
                <div class="card border-0 shadow-sm h-100">
                    <div class="card-body d-flex align-items-center gap-3">
                        <div style="font-size:2.5rem; color:${c.color};">
                            <i class="bi ${c.icon}"></i>
                        </div>
                        <div>
                            <div class="fs-2 fw-bold" style="color:${c.color};">${c.count}</div>
                            <div class="text-muted small">${c.label}</div>
                        </div>
                    </div>
                </div>
            </div>`;
        });

        html += `</div>`;
        $('#contentArea').html(html);
        $('.nav-link').removeClass('active');
        $(this).addClass('active');
    });

    $('#addStockLink').click(function () {
        var addStockModal = new bootstrap.Modal(document.getElementById('addStockModal'));
        addStockModal.show();
    });

    $('#addSupplierStockForm').submit(function (e) {
        e.preventDefault();

        let loggedIn = JSON.parse(localStorage.getItem("logList"));

        const name = $('#supplier-product-name').val().trim();
        const description = $('#supplier-product-description').val().trim();
        const supplierId = loggedIn[0].id;
        const price = parseFloat($('#supplier-product-price').val());
        const stock = parseInt($('#supplier-product-stock').val());

        if (!name || !description || isNaN(supplierId) || isNaN(price) || isNaN(stock)) {
            alert("Please fill in all fields correctly.");
            return;
        }

        let products = SupplierStockStorage.getProducts();
        const newId = products.length ? products[products.length - 1].id + 1 : 1;
        const newProduct = new SupplierStock(newId, name, description, supplierId, price, stock);

        SupplierStockStorage.addProduct(newProduct);

        alert("Supplier stock added successfully!");
        $('#addSupplierStockForm')[0].reset();

        // Hide modal
        var modalEl = document.getElementById('addStockModal');
        var modalInstance = bootstrap.Modal.getInstance(modalEl);
        modalInstance.hide();
    });

    // ====================== DISPLAY SUPPLIER STOCKS ======================
    function displayStocks() {
        let loggedIn = JSON.parse(localStorage.getItem("logList")) || [];
        if (loggedIn.length === 0) {
            $('#contentArea').html('<p class="text-danger">No logged in supplier.</p>');
            return;
        }

        const currentSupplierId = loggedIn[0].id;
        let products = SupplierStockStorage.getProducts();
        let supplierStocks = products.filter(product => product.supplierId === currentSupplierId);

        let tableHTML = `<h4 class="mb-3">My Stocks</h4>`;

        if (supplierStocks.length === 0) {
            tableHTML += '<p class="text-center mt-3">No supplier stocks available.</p>';
        } else {
            tableHTML += `
            <div class="table-responsive">
            <table class="table table-bordered table-striped">
            <thead class="table-dark">
            <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Description</th>
                <th>Price</th>
                <th>Stock</th>
            </tr>
            </thead>
            <tbody>`;

            supplierStocks.forEach(product => {
                tableHTML += `
                <tr>
                    <td>${product.id}</td>
                    <td>${product.name}</td>
                    <td>${product.description}</td>
                    <td>${product.price.toFixed(2)}</td>
                    <td>${product.stock}</td>
                </tr>`;
            });

            tableHTML += `</tbody></table></div>`;
        }

        $('#contentArea').html(tableHTML);
    }

    $('#viewStocksLink').click(function (e) {
        e.preventDefault();
        displayStocks();
    });

    // ====================== DISPLAY REQUESTS ======================
    function displayRequests() {
        const requests = JSON.parse(localStorage.getItem("requests")) || [];
        const logList = JSON.parse(localStorage.getItem("logList")) || [];

        if (logList.length === 0) {
            $('#contentArea').html("<p>No logged in supplier</p>");
            return;
        }

        const supplierId = logList[0].id;

        let html = `
        <h4 class="mb-3">Request Notifications</h4>
        <table class="table table-bordered">
        <thead class="table-dark">
        <tr>
            <th>Request ID</th>
            <th>Requested By</th>
            <th>Product</th>
            <th>Price</th>
            <th>Quantity</th>
            <th>Date</th>
            <th>Status</th>
            <th>Action</th>
        </tr>
        </thead>
        <tbody>
        `;

        let hasRequest = false;

        requests.forEach(req => {
            req.items.forEach((item, index) => {
                if (item.supplierId == supplierId &&
                    ["Approved","Out for Delivery","Rejected","Delivered"].includes(item.status)) {

                    hasRequest = true;

                    let statusColor = "green";
                    if (item.status === "Out for Delivery") statusColor = "darkblue";
                    else if (item.status === "Rejected") statusColor = "red";
                    else if (item.status === "Delivered") statusColor = "darkgreen";

                    let actionButtons = '';
                    if(item.status === "Approved") {
                        actionButtons = `
                            <button class="btn btn-success btn-sm acceptRequest me-1"
                                    data-req="${req.id}" data-index="${index}">Accept</button>
                            <button class="btn btn-danger btn-sm declineRequest"
                                    data-req="${req.id}" data-index="${index}">Decline</button>`;
                    } else if(item.status === "Out for Delivery") {
                        actionButtons = `
                            <button class="btn btn-primary btn-sm markDelivered"
                                    data-req="${req.id}" data-index="${index}">Mark as Delivered</button>`;
                    } else {
                        actionButtons = `<span class="text-muted fst-italic">No Action</span>`;
                    }

                    html += `
                        <tr>
                            <td>${req.id}</td>
                            <td>${item.requestedBy}</td>
                            <td>${item.productName}</td>
                            <td>₱${parseFloat(item.unitPrice).toFixed(2)}</td>
                            <td>${item.quantity}</td>
                            <td>${req.date}</td>
                            <td style="color:${statusColor}"><strong>${item.status}</strong></td>
                            <td>${actionButtons}</td>
                        </tr>`;
                }
            });
        });

        if(!hasRequest){
            html += `<tr><td colspan="8" class="text-center">No approved requests for you yet.</td></tr>`;
        }

        html += `</tbody></table>`;
        $('#contentArea').html(html);
    }

    $('#requestNotifLink').click(function () {
        displayRequests();
    });

    // ====================== ACCEPT / DECLINE / DELIVER ======================
    $(document).on("click", ".acceptRequest", function () {
        const requestId = parseInt($(this).data("req"));
        const itemIndex = parseInt($(this).data("index"));
        let requests = JSON.parse(localStorage.getItem("requests")) || [];
        const request = requests.find(r => r.id === requestId);
        if (!request) return;

        const item = request.items[itemIndex];
        const supplierProducts = SupplierStockStorage.getProducts();
        const supplierProduct = supplierProducts.find(p =>
            p.name === item.productName && p.supplierId == item.supplierId
        );

        if (!supplierProduct) { alert(`Product "${item.productName}" not found in stock.`); return; }
        if (supplierProduct.stock < item.quantity) { alert(`Insufficient stock.`); return; }

        request.items[itemIndex].status = "Out for Delivery";
        localStorage.setItem("requests", JSON.stringify(requests));
        updateNotifCount();
        displayRequests();
    });

    $(document).on("click", ".declineRequest", function () {
        const requestId = parseInt($(this).data("req"));
        const itemIndex = parseInt($(this).data("index"));
        let requests = JSON.parse(localStorage.getItem("requests")) || [];
        const request = requests.find(r => r.id === requestId);
        if (!request) return;

        request.items[itemIndex].status = "Rejected";
        localStorage.setItem("requests", JSON.stringify(requests));
        updateNotifCount();
        displayRequests();
    });

    $(document).on("click", ".markDelivered", function () {
        const requestId = parseInt($(this).data("req"));
        const itemIndex = parseInt($(this).data("index"));

        let requests = JSON.parse(localStorage.getItem("requests")) || [];
        const request = requests.find(r => r.id === requestId);
        if (!request) return;

        const item = request.items[itemIndex];
        const supplierProducts = SupplierStockStorage.getProducts();
        const supplierProduct = supplierProducts.find(p =>
            p.name === item.productName && p.supplierId == item.supplierId
        );

        if (!supplierProduct) { alert(`Product "${item.productName}" not found.`); return; }
        if (supplierProduct.stock < item.quantity) { alert(`Insufficient stock.`); return; }

        supplierProduct.stock -= item.quantity;
        SupplierStockStorage.saveProducts(supplierProducts);

        let adminProducts = JSON.parse(localStorage.getItem("products")) || [];
        let adminProduct = adminProducts.find(p =>
            p.name.toLowerCase() === item.productName.toLowerCase()
        );

        if (adminProduct) {
            adminProduct.stock += item.quantity;
        } else {
            const newId = adminProducts.length ? adminProducts[adminProducts.length - 1].id + 1 : 1;
            adminProducts.push({
                id: newId,
                name: item.productName,
                description: supplierProduct.description || "Added from delivery",
                supplierId: item.supplierId,
                purchasePrice: item.unitPrice,
                sellingPrice: parseFloat((item.unitPrice * 1.2).toFixed(2)),
                stock: item.quantity
            });
        }
        localStorage.setItem("products", JSON.stringify(adminProducts));

        request.items[itemIndex].status = "Delivered";
        localStorage.setItem("requests", JSON.stringify(requests));

        alert(`"${item.productName}" marked as Delivered!`);

        updateNotifCount();
        displayRequests();
    });

    // ====================== UPDATE NOTIFICATION COUNT ======================
    function updateNotifCount() {
        const requests = JSON.parse(localStorage.getItem("requests")) || [];
        const logList = JSON.parse(localStorage.getItem("logList")) || [];

        if (logList.length === 0) { $('#notifCount').text(0); return; }

        const supplierId = logList[0].id;
        let count = 0;
        requests.forEach(req => {
            req.items.forEach(item => {
                if(item.supplierId == supplierId && item.status === "Approved") count++;
            });
        });

        $('#notifCount').text(count);
    }

    updateNotifCount();

    // ====================== TRANSACTION HISTORY ======================
    $('#transactionHistoryLink').click(function (e) {
        e.preventDefault();
        displayTransactionHistory();
        $('.nav-link').removeClass('active');
        $(this).addClass('active');
    });

    function displayTransactionHistory() {
        const requests = JSON.parse(localStorage.getItem("requests")) || [];
        const logList  = JSON.parse(localStorage.getItem("logList"))  || [];

        if (logList.length === 0) {
            $('#contentArea').html("<p class='text-danger'>No logged in supplier.</p>");
            return;
        }

        const supplierId = logList[0].id;

        let transactions = [];
        requests.forEach(req => {
            req.items.forEach(item => {
                if (item.supplierId == supplierId &&
                    (item.status === "Delivered" || item.status === "Rejected")) {
                    transactions.push({ req, item });
                }
            });
        });

        const delivered      = transactions.filter(t => t.item.status === "Delivered");
        const totalDelivered = delivered.length;
        const totalUnits     = delivered.reduce((sum, t) => sum + t.item.quantity, 0);
        const totalValue     = delivered.reduce((sum, t) => sum + (t.item.unitPrice * t.item.quantity), 0);

        let html = `
        <h4 class="mb-3">Transaction History</h4>
        <div class="row g-3 mb-4">
            <div class="col-sm-4">
                <div class="card border-0 shadow-sm text-center p-3">
                    <div class="fs-2 fw-bold text-success">${totalDelivered}</div>
                    <div class="text-muted small">Completed Deliveries</div>
                </div>
            </div>
            <div class="col-sm-4">
                <div class="card border-0 shadow-sm text-center p-3">
                    <div class="fs-2 fw-bold text-primary">${totalUnits}</div>
                    <div class="text-muted small">Total Units Delivered</div>
                </div>
            </div>
            <div class="col-sm-4">
                <div class="card border-0 shadow-sm text-center p-3">
                    <div class="fs-2 fw-bold text-warning">₱${totalValue.toFixed(2)}</div>
                    <div class="text-muted small">Total Value Delivered</div>
                </div>
            </div>
        </div>`;

        if (transactions.length === 0) {
            html += `<p class="text-muted">No transactions yet.</p>`;
            $('#contentArea').html(html);
            return;
        }

        html += `
        <div class="d-flex gap-2 mb-3 flex-wrap">
            <input type="text" id="supplierTransactionSearch" class="form-control" style="max-width:260px;" placeholder="Search product or requester…">
            <select id="supplierTransactionStatusFilter" class="form-select" style="max-width:180px;">
                <option value="">All Statuses</option>
                <option value="Delivered">Delivered</option>
                <option value="Rejected">Rejected</option>
            </select>
            <select id="supplierTransactionRoleFilter" class="form-select" style="max-width:180px;">
                <option value="">All Roles</option>
                <option value="Admin">Admin</option>
                <option value="Staff">Staff</option>
            </select>
        </div>

        <div class="table-responsive">
        <table class="table table-bordered table-striped">
        <thead class="table-dark">
            <tr>
                <th>Request ID</th>
                <th>Requested By</th>
                <th>Role</th>
                <th>Product</th>
                <th>Unit Price</th>
                <th>Qty</th>
                <th>Total</th>
                <th>Date</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody id="supplierTransactionBody">`;

        transactions.forEach(({ req, item }) => {
            const role        = item.requestedByRole || req.requestedByRole || "—";
            const total       = (item.unitPrice * item.quantity).toFixed(2);
            const statusColor = item.status === "Delivered" ? "darkgreen" : "red";

            html += `
            <tr data-product="${item.productName.toLowerCase()}"
                data-requester="${req.requestedBy.toLowerCase()}"
                data-role="${role}"
                data-status="${item.status}">
                <td>${req.id}</td>
                <td>${req.requestedBy}</td>
                <td><span class="badge ${role === 'Admin' ? 'bg-primary' : 'bg-warning text-dark'}">${role}</span></td>
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
            const query  = $('#supplierTransactionSearch').val().toLowerCase();
            const status = $('#supplierTransactionStatusFilter').val();
            const role   = $('#supplierTransactionRoleFilter').val().toLowerCase();
            $('#supplierTransactionBody tr').each(function () {
                const product   = $(this).data('product')   || '';
                const requester = $(this).data('requester') || '';
                const rowRole   = $(this).data('role')      || '';
                const rowStatus = $(this).data('status')    || '';
                const matchSearch = product.includes(query) || requester.includes(query);
                const matchStatus = !status || rowStatus === status;
                const matchRole   = !role   || rowRole.toLowerCase() === role;
                $(this).toggle(matchSearch && matchStatus && matchRole);
            });
        }
        $('#supplierTransactionSearch').on('input', filterTransaction);
        $('#supplierTransactionStatusFilter').on('change', filterTransaction);
        $('#supplierTransactionRoleFilter').on('change', filterTransaction);
    }

    // ====================== LOGOUT ======================
    $('#logOut').click(function (e) {
        e.preventDefault();
        if(confirm("Are you sure you want to logout?")) {
            localStorage.removeItem("logList");
            window.location.href = "index.html";
        }
    });

});