const App = {
    cart: [],
    
    init() {
        this.loadCart();
        this.setupNewsletterForm();
        this.setupCartModal();
        this.updateCartCount();
    },
    
    loadCart() {
        const savedCart = localStorage.getItem('cart');
        
        if (savedCart) {
            this.cart = JSON.parse(savedCart);
        }
    },
    
    saveCart() {
        localStorage.setItem('cart', JSON.stringify(this.cart));
        this.updateCartCount();
    },
    
    addToCart(product, quantity = 1) {
        const existingItemIndex = this.cart.findIndex(item => item.id === product.id);
        
        if (existingItemIndex !== -1) {
            this.cart[existingItemIndex].quantity += quantity;
        } else {
            this.cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                imageUrl: product.imageUrl,
                quantity
            });
        }
        
        this.saveCart();
        this.showToast('Product added to cart');
    },
    
    updateCartItem(productId, quantity) {
        const itemIndex = this.cart.findIndex(item => item.id === productId);
        
        if (itemIndex !== -1) {
            if (quantity > 0) {
                this.cart[itemIndex].quantity = quantity;
            } else {
                this.cart.splice(itemIndex, 1);
            }
            
            this.saveCart();
            this.renderCartItems();
        }
    },
    
    removeFromCart(productId) {
        const itemIndex = this.cart.findIndex(item => item.id === productId);
        
        if (itemIndex !== -1) {
            this.cart.splice(itemIndex, 1);
            this.saveCart();
            this.renderCartItems();
        }
    },
    
    clearCart() {
        this.cart = [];
        this.saveCart();
        this.renderCartItems();
    },
    
    getCartTotal() {
        return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2);
    },
    
    updateCartCount() {
        const cartCount = document.getElementById('cart-count');
        
        if (cartCount) {
            const itemsCount = this.cart.reduce((count, item) => count + item.quantity, 0);
            cartCount.textContent = itemsCount;
        }
    },
    
    setupCartModal() {
        const cartIcon = document.getElementById('cart-icon');
        const cartModal = document.getElementById('cart-modal');
        const closeModal = cartModal?.querySelector('.close-modal');
        const checkoutBtn = document.getElementById('checkout-btn');
        
        if (cartIcon && cartModal) {
            cartIcon.addEventListener('click', e => {
                e.preventDefault();
                cartModal.style.display = 'block';
                this.renderCartItems();
            });
            
            closeModal.addEventListener('click', () => {
                cartModal.style.display = 'none';
            });
            
            window.addEventListener('click', e => {
                if (e.target === cartModal) {
                    cartModal.style.display = 'none';
                }
            });
            
            if (checkoutBtn) {
                checkoutBtn.addEventListener('click', () => {
                    if (this.cart.length === 0) {
                        this.showToast('Your cart is empty');
                        return;
                    }
                    
                    this.checkout();
                });
            }
        }
    },
    
    renderCartItems() {
        const cartItemsContainer = document.getElementById('cart-items');
        const cartTotalPrice = document.getElementById('cart-total-price');
        
        if (cartItemsContainer) {
            if (this.cart.length === 0) {
                cartItemsContainer.innerHTML = '<p>Your cart is empty</p>';
            } else {
                cartItemsContainer.innerHTML = this.cart.map(item => `
                    <div class="cart-item">
                        <div class="cart-item-image">
                            <img src="${item.imageUrl}" alt="${item.name}">
                        </div>
                        <div class="cart-item-details">
                            <h3 class="cart-item-name">${item.name}</h3>
                            <p class="cart-item-price">$${item.price.toFixed(2)}</p>
                            <div class="cart-item-actions">
                                <div class="cart-quantity">
                                    <button class="decrease-quantity" data-id="${item.id}">-</button>
                                    <span>${item.quantity}</span>
                                    <button class="increase-quantity" data-id="${item.id}">+</button>
                                </div>
                                <span class="cart-remove" data-id="${item.id}">Remove</span>
                            </div>
                        </div>
                    </div>
                `).join('');
                
                const decreaseButtons = cartItemsContainer.querySelectorAll('.decrease-quantity');
                const increaseButtons = cartItemsContainer.querySelectorAll('.increase-quantity');
                const removeButtons = cartItemsContainer.querySelectorAll('.cart-remove');
                
                decreaseButtons.forEach(button => {
                    button.addEventListener('click', () => {
                        const id = button.getAttribute('data-id');
                        const item = this.cart.find(item => item.id === id);
                        
                        if (item) {
                            this.updateCartItem(id, item.quantity - 1);
                        }
                    });
                });
                
                increaseButtons.forEach(button => {
                    button.addEventListener('click', () => {
                        const id = button.getAttribute('data-id');
                        const item = this.cart.find(item => item.id === id);
                        
                        if (item) {
                            this.updateCartItem(id, item.quantity + 1);
                        }
                    });
                });
                
                removeButtons.forEach(button => {
                    button.addEventListener('click', () => {
                        const id = button.getAttribute('data-id');
                        this.removeFromCart(id);
                    });
                });
            }
            
            if (cartTotalPrice) {
                cartTotalPrice.textContent = `$${this.getCartTotal()}`;
            }
        }
    },
    
    async checkout() {
        try {
            if (!auth.currentUser) {
                window.location.href = 'login.html';
                return;
            }
            
            const user = await Database.getUserById(auth.currentUser.uid);
            
            if (!user.address) {
                this.showToast('Please update your address in your account settings');
                return;
            }
            
            const orderData = {
                userId: auth.currentUser.uid,
                products: this.cart.map(item => ({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity
                })),
                totalPrice: parseFloat(this.getCartTotal())
            };
            
            const orderId = await Database.createOrder(orderData);
            
            if (orderId) {
                this.clearCart();
                this.showToast('Order placed successfully!');
                
                const cartModal = document.getElementById('cart-modal');
                if (cartModal) {
                    cartModal.style.display = 'none';
                }
            }
        } catch (error) {
            console.error('Error during checkout:', error);
            this.showToast('An error occurred during checkout');
        }
    },
    
    setupNewsletterForm() {
        const newsletterForm = document.getElementById('newsletter-form');
        
        if (newsletterForm) {
            newsletterForm.addEventListener('submit', async e => {
                e.preventDefault();
                
                const emailInput = document.getElementById('newsletter-email');
                const email = emailInput.value.trim();
                
                if (!email) return;
                
                try {
                    const result = await Database.subscribeToNewsletter(email);
                    
                    if (result.success) {
                        this.showToast(result.message);
                        emailInput.value = '';
                    } else {
                        this.showToast(result.message);
                    }
                } catch (error) {
                    console.error('Newsletter subscription error:', error);
                    this.showToast('An error occurred. Please try again.');
                }
            });
        }
    },
    
    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

const style = document.createElement('style');
style.textContent = `
.toast {
    position: fixed;
    bottom: 20px;
    right: 20px;
    background-color: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 12px 20px;
    border-radius: 4px;
    font-size: 14px;
    z-index: 1000;
    opacity: 0;
    transform: translateY(50px);
    transition: opacity 0.3s, transform 0.3s;
}
.toast.show {
    opacity: 1;
    transform: translateY(0);
}
`;
document.head.appendChild(style);