const ProductDetail = {
    product: null,
    
    init() {
        this.loadProductFromURL();
        this.setupQuantityControls();
        this.setupAddToCartButton();
        this.setupBuyNowButton();
    },
    
    async loadProductFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');
        
        if (!productId) {
            window.location.href = 'products.html';
            return;
        }
        
        try {
            this.product = await Database.getProductById(productId);
            
            if (!this.product) {
                window.location.href = 'products.html';
                return;
            }
            
            this.displayProductDetails();
            this.loadRelatedProducts();
        } catch (error) {
            console.error('Error loading product details:', error);
            App.showToast('Error loading product details');
        }
    },
    
    displayProductDetails() {
        document.title = `ShopFire - ${this.product.name}`;
        
        const nameElement = document.getElementById('product-detail-name');
        const breadcrumbNameElement = document.getElementById('product-breadcrumb-name');
        const imageElement = document.getElementById('product-detail-image');
        const categoryElement = document.getElementById('product-detail-category');
        const priceElement = document.getElementById('product-detail-price');
        const descriptionElement = document.getElementById('product-detail-description');
        
        if (nameElement) nameElement.textContent = this.product.name;
        if (breadcrumbNameElement) breadcrumbNameElement.textContent = this.product.name;
        if (imageElement) imageElement.src = this.product.imageUrl;
        if (categoryElement) categoryElement.textContent = this.product.category;
        if (priceElement) priceElement.textContent = this.product.price.toFixed(2);
        if (descriptionElement) descriptionElement.textContent = this.product.description;
    },
    
    setupQuantityControls() {
        const decreaseBtn = document.getElementById('decrease-quantity');
        const increaseBtn = document.getElementById('increase-quantity');
        const quantityInput = document.getElementById('product-quantity');
        
        if (decreaseBtn && increaseBtn && quantityInput) {
            decreaseBtn.addEventListener('click', () => {
                const currentValue = parseInt(quantityInput.value);
                if (currentValue > 1) {
                    quantityInput.value = currentValue - 1;
                }
            });
            
            increaseBtn.addEventListener('click', () => {
                const currentValue = parseInt(quantityInput.value);
                if (currentValue < 99) {
                    quantityInput.value = currentValue + 1;
                }
            });
            
            quantityInput.addEventListener('change', () => {
                let value = parseInt(quantityInput.value);
                
                if (isNaN(value) || value < 1) {
                    value = 1;
                } else if (value > 99) {
                    value = 99;
                }
                
                quantityInput.value = value;
            });
        }
    },
    
    setupAddToCartButton() {
        const addToCartBtn = document.getElementById('add-to-cart');
        
        if (addToCartBtn) {
            addToCartBtn.addEventListener('click', () => {
                if (!this.product) return;
                
                const quantityInput = document.getElementById('product-quantity');
                const quantity = parseInt(quantityInput.value);
                
                App.addToCart(this.product, quantity);
            });
        }
    },
    
    setupBuyNowButton() {
        const buyNowBtn = document.getElementById('buy-now');
        
        if (buyNowBtn) {
            buyNowBtn.addEventListener('click', () => {
                if (!this.product) return;
                
                const quantityInput = document.getElementById('product-quantity');
                const quantity = parseInt(quantityInput.value);
                
                App.cart = [{
                    id: this.product.id,
                    name: this.product.name,
                    price: this.product.price,
                    imageUrl: this.product.imageUrl,
                    quantity
                }];
                
                App.saveCart();
                
                if (auth.currentUser) {
                    App.checkout();
                } else {
                    window.location.href = 'login.html';
                }
            });
        }
    },
    
    async loadRelatedProducts() {
        const relatedProductsGrid = document.getElementById('related-products-grid');
        
        if (relatedProductsGrid && this.product) {
            try {
                const products = await Database.getProducts({
                    category: this.product.category,
                    limit: 4
                });
                
                const relatedProducts = products.filter(product => product.id !== this.product.id);
                
                if (relatedProducts.length > 0) {
                    relatedProductsGrid.innerHTML = relatedProducts.map(product => `
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
                    `).join('');
                    
                    const addToCartButtons = relatedProductsGrid.querySelectorAll('.add-to-cart');
                    
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
                } else {
                    relatedProductsGrid.innerHTML = '<p>No related products found.</p>';
                }
            } catch (error) {
                console.error('Error loading related products:', error);
                relatedProductsGrid.innerHTML = '<p>Error loading related products.</p>';
            }
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    ProductDetail.init();
});