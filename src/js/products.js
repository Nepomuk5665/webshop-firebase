const Products = {
    currentCategory: 'all',
    currentPage: 1,
    productsPerPage: 8,
    sortOption: 'newest',
    minPrice: null,
    maxPrice: null,
    lastProduct: null,
    
    init() {
        this.setupFeaturedProducts();
        this.setupProductsPage();
        this.setupCategoryFilters();
        this.setupPriceFilter();
        this.setupSortFilter();
        this.setupProductGrid();
    },
    
    async setupFeaturedProducts() {
        const featuredProductsGrid = document.getElementById('featured-products-grid');
        
        if (featuredProductsGrid) {
            try {
                const products = await Database.getProducts({ featured: true, limit: 4 });
                
                if (products.length > 0) {
                    featuredProductsGrid.innerHTML = products.map(product => this.createProductCard(product)).join('');
                    this.setupAddToCartButtons();
                } else {
                    featuredProductsGrid.innerHTML = '<p>No featured products found.</p>';
                }
            } catch (error) {
                console.error('Error loading featured products:', error);
                featuredProductsGrid.innerHTML = '<p>Error loading products. Please try again later.</p>';
            }
        }
    },
    
    async setupProductsPage() {
        const productsGrid = document.getElementById('products-grid');
        
        if (productsGrid) {
            await this.loadProducts();
            this.setupPagination();
        }
    },
    
    async setupCategoryFilters() {
        const categoryList = document.getElementById('category-list');
        
        if (categoryList) {
            try {
                const categories = await Database.getCategories();
                
                if (categories.length > 0) {
                    const categoryLinks = categories.map(category => `
                        <li><a href="#" data-category="${category.id}">${category.name}</a></li>
                    `).join('');
                    
                    categoryList.innerHTML = `
                        <li><a href="#" class="active" data-category="all">All Products</a></li>
                        ${categoryLinks}
                    `;
                    
                    const links = categoryList.querySelectorAll('a');
                    
                    links.forEach(link => {
                        link.addEventListener('click', e => {
                            e.preventDefault();
                            
                            links.forEach(l => l.classList.remove('active'));
                            link.classList.add('active');
                            
                            this.currentCategory = link.getAttribute('data-category');
                            this.currentPage = 1;
                            this.lastProduct = null;
                            this.loadProducts();
                        });
                    });
                }
            } catch (error) {
                console.error('Error loading categories:', error);
            }
        }
    },
    
    setupPriceFilter() {
        const applyPriceFilter = document.getElementById('apply-price-filter');
        
        if (applyPriceFilter) {
            applyPriceFilter.addEventListener('click', () => {
                const minPrice = document.getElementById('min-price').value;
                const maxPrice = document.getElementById('max-price').value;
                
                this.minPrice = minPrice ? parseFloat(minPrice) : null;
                this.maxPrice = maxPrice ? parseFloat(maxPrice) : null;
                this.currentPage = 1;
                this.lastProduct = null;
                this.loadProducts();
            });
        }
    },
    
    setupSortFilter() {
        const sortSelect = document.getElementById('sort-products');
        
        if (sortSelect) {
            sortSelect.addEventListener('change', () => {
                this.sortOption = sortSelect.value;
                this.currentPage = 1;
                this.lastProduct = null;
                this.loadProducts();
            });
        }
    },
    
    async loadProducts() {
        const productsGrid = document.getElementById('products-grid');
        
        if (productsGrid) {
            productsGrid.innerHTML = '<div class="loading">Loading products...</div>';
            
            try {
                const options = {
                    limit: this.productsPerPage,
                    sort: this.sortOption
                };
                
                if (this.currentCategory !== 'all') {
                    options.category = this.currentCategory;
                }
                
                if (this.minPrice !== null) {
                    options.minPrice = this.minPrice;
                }
                
                if (this.maxPrice !== null) {
                    options.maxPrice = this.maxPrice;
                }
                
                if (this.lastProduct && this.currentPage > 1) {
                    options.startAfter = this.lastProduct;
                }
                
                const products = await Database.getProducts(options);
                
                if (products.length > 0) {
                    productsGrid.innerHTML = products.map(product => this.createProductCard(product)).join('');
                    
                    if (products.length === this.productsPerPage) {
                        this.lastProduct = products[products.length - 1].id;
                    } else {
                        this.lastProduct = null;
                    }
                    
                    this.setupAddToCartButtons();
                    this.setupPagination();
                } else {
                    productsGrid.innerHTML = '<p>No products found with the selected filters.</p>';
                    this.lastProduct = null;
                    this.setupPagination();
                }
            } catch (error) {
                console.error('Error loading products:', error);
                productsGrid.innerHTML = '<p>Error loading products. Please try again later.</p>';
            }
        }
    },
    
    createProductCard(product) {
        return `
            <div class="product-card">
                <div class="product-image">
                    <img src="${product.imageUrl}" alt="${product.name}">
                </div>
                <div class="product-info">
                    <h3><a href="product-detail.html?id=${product.id}">${product.name}</a></h3>
                    <p class="product-category">${product.category}</p>
                    <p class="product-price">$${product.price.toFixed(2)}</p>
                    <div class="product-actions">
                        <button class="btn btn-small add-to-cart" data-id="${product.id}">Add to Cart</button>
                        <a href="product-detail.html?id=${product.id}" class="btn btn-small btn-secondary">Details</a>
                    </div>
                </div>
            </div>
        `;
    },
    
    setupAddToCartButtons() {
        const addToCartButtons = document.querySelectorAll('.add-to-cart');
        
        addToCartButtons.forEach(button => {
            button.addEventListener('click', async () => {
                const productId = button.getAttribute('data-id');
                
                try {
                    const product = await Database.getProductById(productId);
                    
                    if (product) {
                        App.addToCart(product);
                    }
                } catch (error) {
                    console.error('Error adding product to cart:', error);
                }
            });
        });
    },
    
    setupPagination() {
        const pagination = document.getElementById('pagination');
        
        if (pagination) {
            if (!this.lastProduct && this.currentPage === 1) {
                pagination.innerHTML = '';
                return;
            }
            
            let paginationHTML = '';
            
            if (this.currentPage > 1) {
                paginationHTML += `<button class="pagination-btn" data-page="${this.currentPage - 1}">Previous</button>`;
            }
            
            paginationHTML += `<span class="pagination-btn active">${this.currentPage}</span>`;
            
            if (this.lastProduct) {
                paginationHTML += `<button class="pagination-btn" data-page="${this.currentPage + 1}">Next</button>`;
            }
            
            pagination.innerHTML = paginationHTML;
            
            const paginationButtons = pagination.querySelectorAll('button');
            
            paginationButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const page = parseInt(button.getAttribute('data-page'));
                    
                    if (page < this.currentPage) {
                        this.currentPage = page;
                        this.lastProduct = null;
                        this.loadProducts();
                    } else if (page > this.currentPage) {
                        this.currentPage = page;
                        this.loadProducts();
                    }
                });
            });
        }
    },
    
    setupProductGrid() {
        const categoriesGrid = document.getElementById('categories-grid');
        
        if (categoriesGrid) {
            this.loadCategories();
        }
    },
    
    async loadCategories() {
        const categoriesGrid = document.getElementById('categories-grid');
        
        if (categoriesGrid) {
            try {
                const categories = await Database.getCategories();
                
                if (categories.length > 0) {
                    categoriesGrid.innerHTML = categories.map(category => `
                        <div class="category-card">
                            <div class="category-image">
                                <img src="images/category-placeholder.jpg" alt="${category.name}">
                            </div>
                            <div class="category-overlay">
                                <h3 class="category-name">${category.name}</h3>
                                <a href="products.html?category=${category.id}" class="btn btn-small">Shop Now</a>
                            </div>
                        </div>
                    `).join('');
                } else {
                    categoriesGrid.innerHTML = '<p>No categories found.</p>';
                }
            } catch (error) {
                console.error('Error loading categories:', error);
                categoriesGrid.innerHTML = '<p>Error loading categories. Please try again later.</p>';
            }
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Products.init();
});