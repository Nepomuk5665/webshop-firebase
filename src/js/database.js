// Ensure Firebase is initialized from firebase-init.js
// Check if we have global firebase objects
if (typeof window.db === 'undefined' || typeof window.auth === 'undefined' || typeof window.createTimestamp === 'undefined') {
    console.error('Firebase services not initialized properly. Make sure firebase-init.js is loaded first.');
}

const Database = {
    async getProducts(options = {}) {
        try {
            const { category, featured, sort, limit, startAfter, minPrice, maxPrice } = options;
            
            let query = window.window.db.collection('products');
            
            if (category && category !== 'all') {
                query = query.where('category', '==', category);
            }
            
            if (featured) {
                query = query.where('featured', '==', true);
            }
            
            if (minPrice !== undefined) {
                query = query.where('price', '>=', parseFloat(minPrice));
            }
            
            if (maxPrice !== undefined) {
                query = query.where('price', '<=', parseFloat(maxPrice));
            }
            
            switch (sort) {
                case 'price-low':
                    query = query.orderBy('price', 'asc');
                    break;
                case 'price-high':
                    query = query.orderBy('price', 'desc');
                    break;
                case 'name-asc':
                    query = query.orderBy('name', 'asc');
                    break;
                case 'name-desc':
                    query = query.orderBy('name', 'desc');
                    break;
                default:
                    query = query.orderBy('dateAdded', 'desc');
            }
            
            if (startAfter) {
                const startAfterDoc = await window.window.db.collection('products').doc(startAfter).get();
                query = query.startAfter(startAfterDoc);
            }
            
            if (limit) {
                query = query.limit(limit);
            }
            
            const snapshot = await query.get();
            
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error getting products:', error);
            return [];
        }
    },
    
    async getProductById(productId) {
        try {
            const doc = await window.db.collection('products').doc(productId).get();
            
            if (doc.exists) {
                return {
                    id: doc.id,
                    ...doc.data()
                };
            }
            
            return null;
        } catch (error) {
            console.error('Error getting product:', error);
            return null;
        }
    },
    
    async getCategories() {
        try {
            const snapshot = await window.db.collection('categories').orderBy('name').get();
            
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error getting categories:', error);
            return [];
        }
    },
    
    async getCategoryById(categoryId) {
        try {
            const doc = await window.db.collection('categories').doc(categoryId).get();
            
            if (doc.exists) {
                return {
                    id: doc.id,
                    ...doc.data()
                };
            }
            
            return null;
        } catch (error) {
            console.error('Error getting category:', error);
            return null;
        }
    },
    
    async createProduct(productData) {
        try {
            const { imageFile, ...product } = productData;
            
            product.dateAdded = window.createTimestamp();
            
            if (imageFile) {
                const imageUrl = await this.uploadProductImage(imageFile);
                product.imageUrl = imageUrl;
            }
            
            const result = await window.db.collection('products').add(product);
            return result.id;
        } catch (error) {
            console.error('Error creating product:', error);
            throw error;
        }
    },
    
    async updateProduct(productId, productData) {
        try {
            const { imageFile, ...updates } = productData;
            
            if (imageFile) {
                const imageUrl = await this.uploadProductImage(imageFile);
                updates.imageUrl = imageUrl;
            }
            
            await window.db.collection('products').doc(productId).update(updates);
            return true;
        } catch (error) {
            console.error('Error updating product:', error);
            throw error;
        }
    },
    
    async deleteProduct(productId) {
        try {
            await window.db.collection('products').doc(productId).delete();
            return true;
        } catch (error) {
            console.error('Error deleting product:', error);
            throw error;
        }
    },
    
    async uploadProductImage(file) {
        try {
            const fileName = `products/${Date.now()}_${file.name}`;
            const storageRef = storage.ref(fileName);
            
            await storageRef.put(file);
            
            return await storageRef.getDownloadURL();
        } catch (error) {
            console.error('Error uploading image:', error);
            throw error;
        }
    },
    
    async createCategory(categoryData) {
        try {
            const result = await window.db.collection('categories').add(categoryData);
            return result.id;
        } catch (error) {
            console.error('Error creating category:', error);
            throw error;
        }
    },
    
    async updateCategory(categoryId, categoryData) {
        try {
            await window.db.collection('categories').doc(categoryId).update(categoryData);
            return true;
        } catch (error) {
            console.error('Error updating category:', error);
            throw error;
        }
    },
    
    async deleteCategory(categoryId) {
        try {
            await window.db.collection('categories').doc(categoryId).delete();
            return true;
        } catch (error) {
            console.error('Error deleting category:', error);
            throw error;
        }
    },
    
    async createOrder(orderData) {
        try {
            orderData.orderDate = window.createTimestamp();
            orderData.status = 'pending';
            
            const result = await window.db.collection('orders').add(orderData);
            return result.id;
        } catch (error) {
            console.error('Error creating order:', error);
            throw error;
        }
    },
    
    async getOrders(options = {}) {
        try {
            const { userId, status, limit, startAfter } = options;
            
            let query = window.db.collection('orders');
            
            if (userId) {
                query = query.where('userId', '==', userId);
            }
            
            if (status) {
                query = query.where('status', '==', status);
            }
            
            query = query.orderBy('orderDate', 'desc');
            
            if (startAfter) {
                const startAfterDoc = await window.db.collection('orders').doc(startAfter).get();
                query = query.startAfter(startAfterDoc);
            }
            
            if (limit) {
                query = query.limit(limit);
            }
            
            const snapshot = await query.get();
            
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error getting orders:', error);
            return [];
        }
    },
    
    async getOrderById(orderId) {
        try {
            const doc = await window.db.collection('orders').doc(orderId).get();
            
            if (doc.exists) {
                return {
                    id: doc.id,
                    ...doc.data()
                };
            }
            
            return null;
        } catch (error) {
            console.error('Error getting order:', error);
            return null;
        }
    },
    
    async updateOrderStatus(orderId, status) {
        try {
            await window.db.collection('orders').doc(orderId).update({ status });
            return true;
        } catch (error) {
            console.error('Error updating order status:', error);
            throw error;
        }
    },
    
    async getUserById(userId) {
        try {
            const doc = await window.db.collection('users').doc(userId).get();
            
            if (doc.exists) {
                return {
                    id: doc.id,
                    ...doc.data()
                };
            }
            
            return null;
        } catch (error) {
            console.error('Error getting user:', error);
            return null;
        }
    },
    
    async updateUserProfile(userId, userData) {
        try {
            await window.db.collection('users').doc(userId).update(userData);
            return true;
        } catch (error) {
            console.error('Error updating user profile:', error);
            throw error;
        }
    },
    
    async getUsers(options = {}) {
        try {
            const { limit, startAfter } = options;
            
            let query = window.db.collection('users').orderBy('createdAt', 'desc');
            
            if (startAfter) {
                const startAfterDoc = await window.db.collection('users').doc(startAfter).get();
                query = query.startAfter(startAfterDoc);
            }
            
            if (limit) {
                query = query.limit(limit);
            }
            
            const snapshot = await query.get();
            
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error getting users:', error);
            return [];
        }
    },
    
    async subscribeToNewsletter(email) {
        try {
            const existingSubscriptions = await window.db.collection('newsletter')
                .where('email', '==', email)
                .get();
            
            if (!existingSubscriptions.empty) {
                return { success: false, message: 'This email is already subscribed' };
            }
            
            await window.db.collection('newsletter').add({
                email,
                subscriptionDate: window.createTimestamp()
            });
            
            return { success: true, message: 'Successfully subscribed to the newsletter' };
        } catch (error) {
            console.error('Error subscribing to newsletter:', error);
            return { success: false, message: 'An error occurred' };
        }
    },
    
    async getNewsletterSubscribers(options = {}) {
        try {
            const { limit, startAfter } = options;
            
            let query = window.db.collection('newsletter').orderBy('subscriptionDate', 'desc');
            
            if (startAfter) {
                const startAfterDoc = await window.db.collection('newsletter').doc(startAfter).get();
                query = query.startAfter(startAfterDoc);
            }
            
            if (limit) {
                query = query.limit(limit);
            }
            
            const snapshot = await query.get();
            
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error getting newsletter subscribers:', error);
            return [];
        }
    },
    
    async submitContactForm(formData) {
        try {
            formData.date = window.createTimestamp();
            
            await window.window.db.collection('contactMessages').add(formData);
            
            return { success: true };
        } catch (error) {
            console.error('Error submitting contact form:', error);
            return { success: false };
        }
    },
    
    async getContactMessages(options = {}) {
        try {
            const { subject, limit, startAfter } = options;
            
            let query = window.db.collection('contactMessages');
            
            if (subject) {
                query = query.where('subject', '==', subject);
            }
            
            query = query.orderBy('date', 'desc');
            
            if (startAfter) {
                const startAfterDoc = await window.db.collection('contactMessages').doc(startAfter).get();
                query = query.startAfter(startAfterDoc);
            }
            
            if (limit) {
                query = query.limit(limit);
            }
            
            const snapshot = await query.get();
            
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error getting contact messages:', error);
            return [];
        }
    },
    
    async deleteContactMessage(messageId) {
        try {
            await window.db.collection('contactMessages').doc(messageId).delete();
            return true;
        } catch (error) {
            console.error('Error deleting contact message:', error);
            throw error;
        }
    }
};