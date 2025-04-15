const Admin = {
    activeTab: 'dashboard',
    productPagination: { currentPage: 1, lastProduct: null },
    orderPagination: { currentPage: 1, lastOrder: null },
    userPagination: { currentPage: 1, lastUser: null },
    newsletterPagination: { currentPage: 1, lastSubscriber: null },
    messagePagination: { currentPage: 1, lastMessage: null },
    selectedProduct: null,
    selectedCategory: null,
    selectedOrder: null,
    selectedMessage: null,
    
    init() {
        this.setupTabs();
        this.loadDashboardData();
        this.setupProductsTab();
        this.setupCategoriesTab();
        this.setupOrdersTab();
        this.setupUsersTab();
        this.setupNewsletterTab();
        this.setupMessagesTab();
        this.setupModals();
    },
    
    setupTabs() {
        const tabLinks = document.querySelectorAll('.admin-sidebar a');
        const tabs = document.querySelectorAll('.admin-tab');
        
        tabLinks.forEach(link => {
            link.addEventListener('click', e => {
                e.preventDefault();
                
                const tabName = link.getAttribute('data-tab');
                
                tabLinks.forEach(l => l.classList.remove('active'));
                tabs.forEach(t => t.classList.add('hidden'));
                
                link.classList.add('active');
                document.getElementById(`${tabName}-tab`).classList.remove('hidden');
                
                this.activeTab = tabName;
                
                if (tabName === 'dashboard') {
                    this.loadDashboardData();
                } else if (tabName === 'products') {
                    this.loadProducts();
                } else if (tabName === 'categories') {
                    this.loadCategories();
                } else if (tabName === 'orders') {
                    this.loadOrders();
                } else if (tabName === 'users') {
                    this.loadUsers();
                } else if (tabName === 'newsletter') {
                    this.loadNewsletterSubscribers();
                } else if (tabName === 'messages') {
                    this.loadContactMessages();
                }
            });
        });
    },
    
    async loadDashboardData() {
        try {
            const productsSnapshot = await db.collection('products').get();
            const ordersSnapshot = await db.collection('orders').get();
            const usersSnapshot = await db.collection('users').get();
            
            const totalProducts = productsSnapshot.size;
            const totalOrders = ordersSnapshot.size;
            const totalUsers = usersSnapshot.size;
            
            let totalRevenue = 0;
            
            ordersSnapshot.forEach(doc => {
                const order = doc.data();
                if (order.totalPrice) {
                    totalRevenue += order.totalPrice;
                }
            });
            
            document.getElementById('total-products').textContent = totalProducts;
            document.getElementById('total-orders').textContent = totalOrders;
            document.getElementById('total-users').textContent = totalUsers;
            document.getElementById('total-revenue').textContent = `$${totalRevenue.toFixed(2)}`;
            
            this.loadRecentOrders();
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    },
    
    async loadRecentOrders() {
        try {
            const ordersSnapshot = await db.collection('orders')
                .orderBy('orderDate', 'desc')
                .limit(5)
                .get();
            
            const recentOrdersTable = document.getElementById('recent-orders-table');
            
            if (recentOrdersTable) {
                if (ordersSnapshot.empty) {
                    recentOrdersTable.innerHTML = '<tr><td colspan="5">No orders found</td></tr>';
                } else {
                    const ordersPromises = ordersSnapshot.docs.map(async doc => {
                        const order = doc.data();
                        const user = await Database.getUserById(order.userId);
                        
                        const orderDate = order.orderDate?.toDate ? order.orderDate.toDate() : new Date();
                        
                        return `
                            <tr>
                                <td>${doc.id.substring(0, 8)}...</td>
                                <td>${user?.name || 'Unknown'}</td>
                                <td>${orderDate.toLocaleDateString()}</td>
                                <td>$${order.totalPrice?.toFixed(2) || '0.00'}</td>
                                <td><span class="status-badge status-${order.status || 'pending'}">${order.status || 'pending'}</span></td>
                            </tr>
                        `;
                    });
                    
                    const ordersHTML = await Promise.all(ordersPromises);
                    recentOrdersTable.innerHTML = ordersHTML.join('');
                }
            }
        } catch (error) {
            console.error('Error loading recent orders:', error);
        }
    },
    
    setupProductsTab() {
        const addProductBtn = document.getElementById('add-product-btn');
        
        if (addProductBtn) {
            addProductBtn.addEventListener('click', () => {
                this.selectedProduct = null;
                this.showProductModal();
            });
        }
        
        const productSearch = document.getElementById('product-search');
        const productCategoryFilter = document.getElementById('product-category-filter');
        
        if (productSearch) {
            productSearch.addEventListener('input', () => {
                this.loadProducts();
            });
        }
        
        if (productCategoryFilter) {
            productCategoryFilter.addEventListener('change', () => {
                this.loadProducts();
            });
            
            this.loadCategoryOptions();
        }
    },
    
    async loadCategoryOptions() {
        const productCategoryFilter = document.getElementById('product-category-filter');
        const productCategorySelect = document.getElementById('product-category');
        
        try {
            const categories = await Database.getCategories();
            
            const categoryOptions = categories.map(category => `
                <option value="${category.id}">${category.name}</option>
            `).join('');
            
            if (productCategoryFilter) {
                productCategoryFilter.innerHTML = `
                    <option value="">All Categories</option>
                    ${categoryOptions}
                `;
            }
            
            if (productCategorySelect) {
                productCategorySelect.innerHTML = `
                    <option value="">Select Category</option>
                    ${categoryOptions}
                `;
            }
        } catch (error) {
            console.error('Error loading category options:', error);
        }
    },
    
    async loadProducts() {
        const productsTable = document.getElementById('products-table');
        const searchInput = document.getElementById('product-search');
        const categoryFilter = document.getElementById('product-category-filter');
        
        if (productsTable) {
            try {
                const options = { limit: 10 };
                
                if (this.productPagination.lastProduct) {
                    options.startAfter = this.productPagination.lastProduct;
                }
                
                let products = await Database.getProducts(options);
                
                const searchValue = searchInput?.value.toLowerCase() || '';
                const categoryValue = categoryFilter?.value || '';
                
                if (searchValue) {
                    products = products.filter(product => 
                        product.name.toLowerCase().includes(searchValue) ||
                        product.description.toLowerCase().includes(searchValue)
                    );
                }
                
                if (categoryValue) {
                    products = products.filter(product => product.category === categoryValue);
                }
                
                if (products.length === 0) {
                    productsTable.innerHTML = '<tr><td colspan="6">No products found</td></tr>';
                    return;
                }
                
                const productsHTML = await Promise.all(products.map(async product => {
                    const category = await Database.getCategoryById(product.category);
                    
                    return `
                        <tr>
                            <td><img src="${product.imageUrl}" alt="${product.name}" width="50"></td>
                            <td>${product.name}</td>
                            <td>${category?.name || 'Unknown'}</td>
                            <td>$${product.price.toFixed(2)}</td>
                            <td>${product.featured ? 'Yes' : 'No'}</td>
                            <td class="table-actions">
                                <button class="edit-product" data-id="${product.id}">Edit</button>
                                <button class="delete-product delete-btn" data-id="${product.id}">Delete</button>
                            </td>
                        </tr>
                    `;
                }));
                
                productsTable.innerHTML = productsHTML.join('');
                
                if (products.length === 10) {
                    this.productPagination.lastProduct = products[products.length - 1].id;
                } else {
                    this.productPagination.lastProduct = null;
                }
                
                this.setupProductActions();
                this.setupProductPagination();
            } catch (error) {
                console.error('Error loading products:', error);
                productsTable.innerHTML = '<tr><td colspan="6">Error loading products</td></tr>';
            }
        }
    },
    
    setupProductActions() {
        const editButtons = document.querySelectorAll('.edit-product');
        const deleteButtons = document.querySelectorAll('.delete-product');
        
        editButtons.forEach(button => {
            button.addEventListener('click', async () => {
                const productId = button.getAttribute('data-id');
                this.selectedProduct = await Database.getProductById(productId);
                this.showProductModal();
            });
        });
        
        deleteButtons.forEach(button => {
            button.addEventListener('click', async () => {
                const productId = button.getAttribute('data-id');
                
                if (confirm('Are you sure you want to delete this product?')) {
                    try {
                        await Database.deleteProduct(productId);
                        this.loadProducts();
                    } catch (error) {
                        console.error('Error deleting product:', error);
                        alert('Error deleting product');
                    }
                }
            });
        });
    },
    
    setupProductPagination() {
        const pagination = document.getElementById('products-pagination');
        
        if (pagination) {
            let paginationHTML = '';
            
            if (this.productPagination.currentPage > 1) {
                paginationHTML += `<button class="pagination-btn prev-page">Previous</button>`;
            }
            
            paginationHTML += `<span class="pagination-btn active">${this.productPagination.currentPage}</span>`;
            
            if (this.productPagination.lastProduct) {
                paginationHTML += `<button class="pagination-btn next-page">Next</button>`;
            }
            
            pagination.innerHTML = paginationHTML;
            
            const prevButton = pagination.querySelector('.prev-page');
            const nextButton = pagination.querySelector('.next-page');
            
            if (prevButton) {
                prevButton.addEventListener('click', () => {
                    this.productPagination.currentPage--;
                    this.productPagination.lastProduct = null;
                    this.loadProducts();
                });
            }
            
            if (nextButton) {
                nextButton.addEventListener('click', () => {
                    this.productPagination.currentPage++;
                    this.loadProducts();
                });
            }
        }
    },
    
    showProductModal() {
        const modal = document.getElementById('product-modal');
        const form = document.getElementById('product-form');
        const modalTitle = document.getElementById('product-modal-title');
        const productNameInput = document.getElementById('product-name');
        const productPriceInput = document.getElementById('product-price');
        const productCategorySelect = document.getElementById('product-category');
        const productDescriptionInput = document.getElementById('product-description');
        const productFeaturedInput = document.getElementById('product-featured');
        const productImageInput = document.getElementById('product-image');
        const productImagePreview = document.getElementById('product-image-preview');
        
        if (modal && form) {
            modal.style.display = 'block';
            
            if (this.selectedProduct) {
                modalTitle.textContent = 'Edit Product';
                productNameInput.value = this.selectedProduct.name;
                productPriceInput.value = this.selectedProduct.price;
                productCategorySelect.value = this.selectedProduct.category;
                productDescriptionInput.value = this.selectedProduct.description;
                productFeaturedInput.checked = this.selectedProduct.featured;
                
                if (this.selectedProduct.imageUrl) {
                    productImagePreview.innerHTML = `<img src="${this.selectedProduct.imageUrl}" alt="${this.selectedProduct.name}">`;
                } else {
                    productImagePreview.innerHTML = '';
                }
            } else {
                modalTitle.textContent = 'Add New Product';
                form.reset();
                productImagePreview.innerHTML = '';
            }
            
            productImageInput.addEventListener('change', event => {
                const file = event.target.files[0];
                
                if (file) {
                    const reader = new FileReader();
                    
                    reader.onload = e => {
                        productImagePreview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
                    };
                    
                    reader.readAsDataURL(file);
                }
            });
            
            form.onsubmit = async e => {
                e.preventDefault();
                
                const formData = {
                    name: productNameInput.value.trim(),
                    price: parseFloat(productPriceInput.value),
                    category: productCategorySelect.value,
                    description: productDescriptionInput.value.trim(),
                    featured: productFeaturedInput.checked,
                    imageFile: productImageInput.files[0]
                };
                
                try {
                    if (this.selectedProduct) {
                        await Database.updateProduct(this.selectedProduct.id, formData);
                    } else {
                        await Database.createProduct(formData);
                    }
                    
                    modal.style.display = 'none';
                    this.loadProducts();
                    this.loadDashboardData();
                } catch (error) {
                    console.error('Error saving product:', error);
                    alert('Error saving product');
                }
            };
        }
    },
    
    setupCategoriesTab() {
        const addCategoryBtn = document.getElementById('add-category-btn');
        
        if (addCategoryBtn) {
            addCategoryBtn.addEventListener('click', () => {
                this.selectedCategory = null;
                this.showCategoryModal();
            });
        }
    },
    
    async loadCategories() {
        const categoriesTable = document.getElementById('categories-table');
        
        if (categoriesTable) {
            try {
                const categories = await Database.getCategories();
                
                if (categories.length === 0) {
                    categoriesTable.innerHTML = '<tr><td colspan="4">No categories found</td></tr>';
                    return;
                }
                
                const categoriesHTML = await Promise.all(categories.map(async category => {
                    const productsSnapshot = await db.collection('products')
                        .where('category', '==', category.id)
                        .get();
                    
                    const productsCount = productsSnapshot.size;
                    
                    return `
                        <tr>
                            <td>${category.name}</td>
                            <td>${category.description}</td>
                            <td>${productsCount}</td>
                            <td class="table-actions">
                                <button class="edit-category" data-id="${category.id}">Edit</button>
                                <button class="delete-category delete-btn" data-id="${category.id}" data-count="${productsCount}">Delete</button>
                            </td>
                        </tr>
                    `;
                }));
                
                categoriesTable.innerHTML = categoriesHTML.join('');
                this.setupCategoryActions();
            } catch (error) {
                console.error('Error loading categories:', error);
                categoriesTable.innerHTML = '<tr><td colspan="4">Error loading categories</td></tr>';
            }
        }
    },
    
    setupCategoryActions() {
        const editButtons = document.querySelectorAll('.edit-category');
        const deleteButtons = document.querySelectorAll('.delete-category');
        
        editButtons.forEach(button => {
            button.addEventListener('click', async () => {
                const categoryId = button.getAttribute('data-id');
                this.selectedCategory = await Database.getCategoryById(categoryId);
                this.showCategoryModal();
            });
        });
        
        deleteButtons.forEach(button => {
            button.addEventListener('click', async () => {
                const categoryId = button.getAttribute('data-id');
                const productsCount = parseInt(button.getAttribute('data-count'));
                
                if (productsCount > 0) {
                    alert(`This category has ${productsCount} products. Please reassign or delete these products before deleting the category.`);
                    return;
                }
                
                if (confirm('Are you sure you want to delete this category?')) {
                    try {
                        await Database.deleteCategory(categoryId);
                        this.loadCategories();
                        this.loadCategoryOptions();
                    } catch (error) {
                        console.error('Error deleting category:', error);
                        alert('Error deleting category');
                    }
                }
            });
        });
    },
    
    showCategoryModal() {
        const modal = document.getElementById('category-modal');
        const form = document.getElementById('category-form');
        const modalTitle = document.getElementById('category-modal-title');
        const categoryNameInput = document.getElementById('category-name');
        const categoryDescriptionInput = document.getElementById('category-description');
        
        if (modal && form) {
            modal.style.display = 'block';
            
            if (this.selectedCategory) {
                modalTitle.textContent = 'Edit Category';
                categoryNameInput.value = this.selectedCategory.name;
                categoryDescriptionInput.value = this.selectedCategory.description;
            } else {
                modalTitle.textContent = 'Add New Category';
                form.reset();
            }
            
            form.onsubmit = async e => {
                e.preventDefault();
                
                const formData = {
                    name: categoryNameInput.value.trim(),
                    description: categoryDescriptionInput.value.trim()
                };
                
                try {
                    if (this.selectedCategory) {
                        await Database.updateCategory(this.selectedCategory.id, formData);
                    } else {
                        await Database.createCategory(formData);
                    }
                    
                    modal.style.display = 'none';
                    this.loadCategories();
                    this.loadCategoryOptions();
                } catch (error) {
                    console.error('Error saving category:', error);
                    alert('Error saving category');
                }
            };
        }
    },
    
    setupOrdersTab() {
        const statusFilter = document.getElementById('order-status-filter');
        const dateFilter = document.getElementById('order-date-filter');
        
        if (statusFilter) {
            statusFilter.addEventListener('change', () => {
                this.orderPagination.currentPage = 1;
                this.orderPagination.lastOrder = null;
                this.loadOrders();
            });
        }
        
        if (dateFilter) {
            dateFilter.addEventListener('change', () => {
                this.orderPagination.currentPage = 1;
                this.orderPagination.lastOrder = null;
                this.loadOrders();
            });
        }
    },
    
    async loadOrders() {
        const ordersTable = document.getElementById('orders-table');
        const statusFilter = document.getElementById('order-status-filter');
        const dateFilter = document.getElementById('order-date-filter');
        
        if (ordersTable) {
            try {
                const options = { limit: 10 };
                
                if (statusFilter && statusFilter.value) {
                    options.status = statusFilter.value;
                }
                
                if (this.orderPagination.lastOrder) {
                    options.startAfter = this.orderPagination.lastOrder;
                }
                
                let orders = await Database.getOrders(options);
                
                if (dateFilter && dateFilter.value) {
                    const selectedDate = new Date(dateFilter.value);
                    selectedDate.setHours(0, 0, 0, 0);
                    
                    orders = orders.filter(order => {
                        const orderDate = order.orderDate?.toDate ? order.orderDate.toDate() : new Date();
                        orderDate.setHours(0, 0, 0, 0);
                        
                        return orderDate.getTime() === selectedDate.getTime();
                    });
                }
                
                if (orders.length === 0) {
                    ordersTable.innerHTML = '<tr><td colspan="6">No orders found</td></tr>';
                    return;
                }
                
                const ordersHTML = await Promise.all(orders.map(async order => {
                    const user = await Database.getUserById(order.userId);
                    const orderDate = order.orderDate?.toDate ? order.orderDate.toDate() : new Date();
                    
                    return `
                        <tr>
                            <td>${order.id.substring(0, 8)}...</td>
                            <td>${user?.name || 'Unknown'}</td>
                            <td>${orderDate.toLocaleDateString()}</td>
                            <td>$${order.totalPrice?.toFixed(2) || '0.00'}</td>
                            <td><span class="status-badge status-${order.status || 'pending'}">${order.status || 'pending'}</span></td>
                            <td class="table-actions">
                                <button class="view-order" data-id="${order.id}">View</button>
                            </td>
                        </tr>
                    `;
                }));
                
                ordersTable.innerHTML = ordersHTML.join('');
                
                if (orders.length === 10 && !dateFilter?.value) {
                    this.orderPagination.lastOrder = orders[orders.length - 1].id;
                } else {
                    this.orderPagination.lastOrder = null;
                }
                
                this.setupOrderActions();
                this.setupOrderPagination();
            } catch (error) {
                console.error('Error loading orders:', error);
                ordersTable.innerHTML = '<tr><td colspan="6">Error loading orders</td></tr>';
            }
        }
    },
    
    setupOrderActions() {
        const viewButtons = document.querySelectorAll('.view-order');
        
        viewButtons.forEach(button => {
            button.addEventListener('click', async () => {
                const orderId = button.getAttribute('data-id');
                this.selectedOrder = await Database.getOrderById(orderId);
                this.showOrderDetailModal();
            });
        });
    },
    
    setupOrderPagination() {
        const pagination = document.getElementById('orders-pagination');
        
        if (pagination) {
            let paginationHTML = '';
            
            if (this.orderPagination.currentPage > 1) {
                paginationHTML += `<button class="pagination-btn prev-page">Previous</button>`;
            }
            
            paginationHTML += `<span class="pagination-btn active">${this.orderPagination.currentPage}</span>`;
            
            if (this.orderPagination.lastOrder) {
                paginationHTML += `<button class="pagination-btn next-page">Next</button>`;
            }
            
            pagination.innerHTML = paginationHTML;
            
            const prevButton = pagination.querySelector('.prev-page');
            const nextButton = pagination.querySelector('.next-page');
            
            if (prevButton) {
                prevButton.addEventListener('click', () => {
                    this.orderPagination.currentPage--;
                    this.orderPagination.lastOrder = null;
                    this.loadOrders();
                });
            }
            
            if (nextButton) {
                nextButton.addEventListener('click', () => {
                    this.orderPagination.currentPage++;
                    this.loadOrders();
                });
            }
        }
    },
    
    async showOrderDetailModal() {
        const modal = document.getElementById('order-detail-modal');
        
        if (modal && this.selectedOrder) {
            try {
                const user = await Database.getUserById(this.selectedOrder.userId);
                const orderItems = this.selectedOrder.products || [];
                
                document.getElementById('order-detail-id').textContent = this.selectedOrder.id;
                document.getElementById('order-customer-name').textContent = user?.name || 'Unknown';
                document.getElementById('order-customer-email').textContent = user?.email || 'Unknown';
                document.getElementById('order-customer-address').textContent = user?.address || 'Not provided';
                
                const orderDate = this.selectedOrder.orderDate?.toDate 
                    ? this.selectedOrder.orderDate.toDate().toLocaleDateString() 
                    : 'Unknown';
                
                document.getElementById('order-date').textContent = orderDate;
                document.getElementById('order-status').value = this.selectedOrder.status || 'pending';
                
                const orderItemsTable = document.getElementById('order-items');
                
                if (orderItems.length === 0) {
                    orderItemsTable.innerHTML = '<tr><td colspan="4">No items in this order</td></tr>';
                } else {
                    orderItemsTable.innerHTML = orderItems.map(item => `
                        <tr>
                            <td>${item.name}</td>
                            <td>$${item.price.toFixed(2)}</td>
                            <td>${item.quantity}</td>
                            <td>$${(item.price * item.quantity).toFixed(2)}</td>
                        </tr>
                    `).join('');
                }
                
                document.getElementById('order-total').textContent = `$${this.selectedOrder.totalPrice?.toFixed(2) || '0.00'}`;
                
                modal.style.display = 'block';
                
                const updateStatusBtn = document.getElementById('update-order-status');
                
                updateStatusBtn.onclick = async () => {
                    const newStatus = document.getElementById('order-status').value;
                    
                    try {
                        await Database.updateOrderStatus(this.selectedOrder.id, newStatus);
                        this.loadOrders();
                        this.loadRecentOrders();
                        alert('Order status updated successfully');
                    } catch (error) {
                        console.error('Error updating order status:', error);
                        alert('Error updating order status');
                    }
                };
            } catch (error) {
                console.error('Error loading order details:', error);
                alert('Error loading order details');
            }
        }
    },
    
    setupUsersTab() {
        const userSearch = document.getElementById('user-search');
        
        if (userSearch) {
            userSearch.addEventListener('input', () => {
                this.userPagination.currentPage = 1;
                this.userPagination.lastUser = null;
                this.loadUsers();
            });
        }
    },
    
    async loadUsers() {
        const usersTable = document.getElementById('users-table');
        const searchInput = document.getElementById('user-search');
        
        if (usersTable) {
            try {
                const options = { limit: 10 };
                
                if (this.userPagination.lastUser) {
                    options.startAfter = this.userPagination.lastUser;
                }
                
                let users = await Database.getUsers(options);
                
                const searchValue = searchInput?.value.toLowerCase() || '';
                
                if (searchValue) {
                    users = users.filter(user => 
                        user.name?.toLowerCase().includes(searchValue) ||
                        user.email?.toLowerCase().includes(searchValue)
                    );
                }
                
                if (users.length === 0) {
                    usersTable.innerHTML = '<tr><td colspan="5">No users found</td></tr>';
                    return;
                }
                
                const usersHTML = await Promise.all(users.map(async user => {
                    const ordersSnapshot = await db.collection('orders')
                        .where('userId', '==', user.id)
                        .get();
                    
                    const ordersCount = ordersSnapshot.size;
                    
                    const createdDate = user.createdAt?.toDate 
                        ? user.createdAt.toDate().toLocaleDateString() 
                        : 'Unknown';
                    
                    return `
                        <tr>
                            <td>${user.name || 'Not provided'}</td>
                            <td>${user.email}</td>
                            <td>${createdDate}</td>
                            <td>${ordersCount}</td>
                            <td class="table-actions">
                                <button class="admin-toggle" data-id="${user.id}" data-admin="${user.isAdmin || false}">
                                    ${user.isAdmin ? 'Remove Admin' : 'Make Admin'}
                                </button>
                            </td>
                        </tr>
                    `;
                }));
                
                usersTable.innerHTML = usersHTML.join('');
                
                if (users.length === 10 && !searchValue) {
                    this.userPagination.lastUser = users[users.length - 1].id;
                } else {
                    this.userPagination.lastUser = null;
                }
                
                this.setupUserActions();
                this.setupUserPagination();
            } catch (error) {
                console.error('Error loading users:', error);
                usersTable.innerHTML = '<tr><td colspan="5">Error loading users</td></tr>';
            }
        }
    },
    
    setupUserActions() {
        const adminToggleButtons = document.querySelectorAll('.admin-toggle');
        
        adminToggleButtons.forEach(button => {
            button.addEventListener('click', async () => {
                const userId = button.getAttribute('data-id');
                const isAdmin = button.getAttribute('data-admin') === 'true';
                
                if (confirm(`Are you sure you want to ${isAdmin ? 'remove' : 'grant'} admin privileges for this user?`)) {
                    try {
                        await Database.updateUserProfile(userId, { isAdmin: !isAdmin });
                        this.loadUsers();
                    } catch (error) {
                        console.error('Error updating user privileges:', error);
                        alert('Error updating user privileges');
                    }
                }
            });
        });
    },
    
    setupUserPagination() {
        const pagination = document.getElementById('users-pagination');
        
        if (pagination) {
            let paginationHTML = '';
            
            if (this.userPagination.currentPage > 1) {
                paginationHTML += `<button class="pagination-btn prev-page">Previous</button>`;
            }
            
            paginationHTML += `<span class="pagination-btn active">${this.userPagination.currentPage}</span>`;
            
            if (this.userPagination.lastUser) {
                paginationHTML += `<button class="pagination-btn next-page">Next</button>`;
            }
            
            pagination.innerHTML = paginationHTML;
            
            const prevButton = pagination.querySelector('.prev-page');
            const nextButton = pagination.querySelector('.next-page');
            
            if (prevButton) {
                prevButton.addEventListener('click', () => {
                    this.userPagination.currentPage--;
                    this.userPagination.lastUser = null;
                    this.loadUsers();
                });
            }
            
            if (nextButton) {
                nextButton.addEventListener('click', () => {
                    this.userPagination.currentPage++;
                    this.loadUsers();
                });
            }
        }
    },
    
    setupNewsletterTab() {
        const exportBtn = document.getElementById('export-subscribers');
        
        if (exportBtn) {
            exportBtn.addEventListener('click', async () => {
                try {
                    const subscribers = await Database.getNewsletterSubscribers();
                    
                    if (subscribers.length === 0) {
                        alert('No subscribers to export');
                        return;
                    }
                    
                    const emailList = subscribers.map(sub => sub.email).join(',\n');
                    const blob = new Blob([emailList], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `newsletter_subscribers_${new Date().toISOString().slice(0, 10)}.csv`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                } catch (error) {
                    console.error('Error exporting subscribers:', error);
                    alert('Error exporting subscribers');
                }
            });
        }
    },
    
    async loadNewsletterSubscribers() {
        const subscribersTable = document.getElementById('newsletter-table');
        
        if (subscribersTable) {
            try {
                const options = { limit: 10 };
                
                if (this.newsletterPagination.lastSubscriber) {
                    options.startAfter = this.newsletterPagination.lastSubscriber;
                }
                
                const subscribers = await Database.getNewsletterSubscribers(options);
                
                if (subscribers.length === 0) {
                    subscribersTable.innerHTML = '<tr><td colspan="3">No subscribers found</td></tr>';
                    return;
                }
                
                subscribersTable.innerHTML = subscribers.map(subscriber => {
                    const subDate = subscriber.subscriptionDate?.toDate 
                        ? subscriber.subscriptionDate.toDate().toLocaleDateString() 
                        : 'Unknown';
                    
                    return `
                        <tr>
                            <td>${subscriber.email}</td>
                            <td>${subDate}</td>
                            <td class="table-actions">
                                <button class="delete-subscriber delete-btn" data-id="${subscriber.id}">Remove</button>
                            </td>
                        </tr>
                    `;
                }).join('');
                
                if (subscribers.length === 10) {
                    this.newsletterPagination.lastSubscriber = subscribers[subscribers.length - 1].id;
                } else {
                    this.newsletterPagination.lastSubscriber = null;
                }
                
                this.setupSubscriberActions();
                this.setupNewsletterPagination();
            } catch (error) {
                console.error('Error loading subscribers:', error);
                subscribersTable.innerHTML = '<tr><td colspan="3">Error loading subscribers</td></tr>';
            }
        }
    },
    
    setupSubscriberActions() {
        const deleteButtons = document.querySelectorAll('.delete-subscriber');
        
        deleteButtons.forEach(button => {
            button.addEventListener('click', async () => {
                const subscriberId = button.getAttribute('data-id');
                
                if (confirm('Are you sure you want to remove this subscriber?')) {
                    try {
                        await db.collection('newsletter').doc(subscriberId).delete();
                        this.loadNewsletterSubscribers();
                    } catch (error) {
                        console.error('Error removing subscriber:', error);
                        alert('Error removing subscriber');
                    }
                }
            });
        });
    },
    
    setupNewsletterPagination() {
        const pagination = document.getElementById('newsletter-pagination');
        
        if (pagination) {
            let paginationHTML = '';
            
            if (this.newsletterPagination.currentPage > 1) {
                paginationHTML += `<button class="pagination-btn prev-page">Previous</button>`;
            }
            
            paginationHTML += `<span class="pagination-btn active">${this.newsletterPagination.currentPage}</span>`;
            
            if (this.newsletterPagination.lastSubscriber) {
                paginationHTML += `<button class="pagination-btn next-page">Next</button>`;
            }
            
            pagination.innerHTML = paginationHTML;
            
            const prevButton = pagination.querySelector('.prev-page');
            const nextButton = pagination.querySelector('.next-page');
            
            if (prevButton) {
                prevButton.addEventListener('click', () => {
                    this.newsletterPagination.currentPage--;
                    this.newsletterPagination.lastSubscriber = null;
                    this.loadNewsletterSubscribers();
                });
            }
            
            if (nextButton) {
                nextButton.addEventListener('click', () => {
                    this.newsletterPagination.currentPage++;
                    this.loadNewsletterSubscribers();
                });
            }
        }
    },
    
    setupMessagesTab() {
        const subjectFilter = document.getElementById('message-subject-filter');
        
        if (subjectFilter) {
            subjectFilter.addEventListener('change', () => {
                this.messagePagination.currentPage = 1;
                this.messagePagination.lastMessage = null;
                this.loadContactMessages();
            });
        }
    },
    
    async loadContactMessages() {
        const messagesTable = document.getElementById('messages-table');
        const subjectFilter = document.getElementById('message-subject-filter');
        
        if (messagesTable) {
            try {
                const options = { limit: 10 };
                
                if (subjectFilter && subjectFilter.value) {
                    options.subject = subjectFilter.value;
                }
                
                if (this.messagePagination.lastMessage) {
                    options.startAfter = this.messagePagination.lastMessage;
                }
                
                const messages = await Database.getContactMessages(options);
                
                if (messages.length === 0) {
                    messagesTable.innerHTML = '<tr><td colspan="4">No messages found</td></tr>';
                    return;
                }
                
                messagesTable.innerHTML = messages.map(message => {
                    const messageDate = message.date?.toDate 
                        ? message.date.toDate().toLocaleDateString() 
                        : 'Unknown';
                    
                    let subject;
                    switch (message.subject) {
                        case 'order':
                            subject = 'Order Inquiry';
                            break;
                        case 'product':
                            subject = 'Product Information';
                            break;
                        case 'return':
                            subject = 'Returns & Refunds';
                            break;
                        case 'other':
                            subject = 'Other';
                            break;
                        default:
                            subject = 'Unknown';
                    }
                    
                    return `
                        <tr>
                            <td>${message.name} (${message.email})</td>
                            <td>${subject}</td>
                            <td>${messageDate}</td>
                            <td class="table-actions">
                                <button class="view-message" data-id="${message.id}">View</button>
                                <button class="delete-message delete-btn" data-id="${message.id}">Delete</button>
                            </td>
                        </tr>
                    `;
                }).join('');
                
                if (messages.length === 10) {
                    this.messagePagination.lastMessage = messages[messages.length - 1].id;
                } else {
                    this.messagePagination.lastMessage = null;
                }
                
                this.setupMessageActions();
                this.setupMessagePagination();
            } catch (error) {
                console.error('Error loading messages:', error);
                messagesTable.innerHTML = '<tr><td colspan="4">Error loading messages</td></tr>';
            }
        }
    },
    
    setupMessageActions() {
        const viewButtons = document.querySelectorAll('.view-message');
        const deleteButtons = document.querySelectorAll('.delete-message');
        
        viewButtons.forEach(button => {
            button.addEventListener('click', async () => {
                const messageId = button.getAttribute('data-id');
                
                try {
                    const snapshot = await db.collection('contactMessages').doc(messageId).get();
                    
                    if (snapshot.exists) {
                        this.selectedMessage = {
                            id: snapshot.id,
                            ...snapshot.data()
                        };
                        
                        this.showMessageDetailModal();
                    }
                } catch (error) {
                    console.error('Error loading message:', error);
                    alert('Error loading message');
                }
            });
        });
        
        deleteButtons.forEach(button => {
            button.addEventListener('click', async () => {
                const messageId = button.getAttribute('data-id');
                
                if (confirm('Are you sure you want to delete this message?')) {
                    try {
                        await Database.deleteContactMessage(messageId);
                        this.loadContactMessages();
                    } catch (error) {
                        console.error('Error deleting message:', error);
                        alert('Error deleting message');
                    }
                }
            });
        });
    },
    
    setupMessagePagination() {
        const pagination = document.getElementById('messages-pagination');
        
        if (pagination) {
            let paginationHTML = '';
            
            if (this.messagePagination.currentPage > 1) {
                paginationHTML += `<button class="pagination-btn prev-page">Previous</button>`;
            }
            
            paginationHTML += `<span class="pagination-btn active">${this.messagePagination.currentPage}</span>`;
            
            if (this.messagePagination.lastMessage) {
                paginationHTML += `<button class="pagination-btn next-page">Next</button>`;
            }
            
            pagination.innerHTML = paginationHTML;
            
            const prevButton = pagination.querySelector('.prev-page');
            const nextButton = pagination.querySelector('.next-page');
            
            if (prevButton) {
                prevButton.addEventListener('click', () => {
                    this.messagePagination.currentPage--;
                    this.messagePagination.lastMessage = null;
                    this.loadContactMessages();
                });
            }
            
            if (nextButton) {
                nextButton.addEventListener('click', () => {
                    this.messagePagination.currentPage++;
                    this.loadContactMessages();
                });
            }
        }
    },
    
    showMessageDetailModal() {
        const modal = document.getElementById('message-detail-modal');
        
        if (modal && this.selectedMessage) {
            document.getElementById('message-from').textContent = this.selectedMessage.name;
            document.getElementById('message-email').textContent = this.selectedMessage.email;
            
            let subject;
            switch (this.selectedMessage.subject) {
                case 'order':
                    subject = 'Order Inquiry';
                    break;
                case 'product':
                    subject = 'Product Information';
                    break;
                case 'return':
                    subject = 'Returns & Refunds';
                    break;
                case 'other':
                    subject = 'Other';
                    break;
                default:
                    subject = 'Unknown';
            }
            
            document.getElementById('message-subject').textContent = subject;
            
            const messageDate = this.selectedMessage.date?.toDate 
                ? this.selectedMessage.date.toDate().toLocaleString() 
                : 'Unknown';
            
            document.getElementById('message-date').textContent = messageDate;
            document.getElementById('message-content').textContent = this.selectedMessage.message;
            
            modal.style.display = 'block';
            
            const deleteBtn = document.getElementById('delete-message-btn');
            
            deleteBtn.onclick = async () => {
                if (confirm('Are you sure you want to delete this message?')) {
                    try {
                        await Database.deleteContactMessage(this.selectedMessage.id);
                        modal.style.display = 'none';
                        this.loadContactMessages();
                    } catch (error) {
                        console.error('Error deleting message:', error);
                        alert('Error deleting message');
                    }
                }
            };
        }
    },
    
    setupModals() {
        const modals = document.querySelectorAll('.modal');
        const closeButtons = document.querySelectorAll('.close-modal, .close-modal-btn');
        
        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                const modal = button.closest('.modal');
                if (modal) {
                    modal.style.display = 'none';
                }
            });
        });
        
        window.addEventListener('click', e => {
            modals.forEach(modal => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Admin.init();
});