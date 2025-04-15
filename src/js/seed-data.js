// This file is used to seed initial data in Firebase
// Run this file once after setting up your Firebase project

// Using Firebase instances defined in firebase-init.js

// Seed categories
async function seedCategories() {
    try {
        const categories = [
            {
                name: 'Electronics',
                description: 'Electronic devices and gadgets'
            },
            {
                name: 'Clothing',
                description: 'Apparel and fashion items'
            },
            {
                name: 'Home & Kitchen',
                description: 'Products for your home and kitchen'
            },
            {
                name: 'Books',
                description: 'Books and publications'
            },
            {
                name: 'Sports & Outdoors',
                description: 'Sports equipment and outdoor gear'
            }
        ];

        console.log('Seeding categories...');
        
        for (const category of categories) {
            await db.collection('categories').add(category);
        }
        
        console.log('Categories seeded successfully!');
    } catch (error) {
        console.error('Error seeding categories:', error);
    }
}

// Create an admin user
async function createAdminUser(email, password, name) {
    try {
        console.log('Creating admin user...');
        
        // Create user with email and password
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        
        // Add user data to Firestore with admin flag
        await db.collection('users').doc(userCredential.user.uid).set({
            name,
            email,
            isAdmin: true,
            createdAt: window.createTimestamp()
        });
        
        console.log('Admin user created successfully!');
    } catch (error) {
        console.error('Error creating admin user:', error);
    }
}

// Add sample products
async function addSampleProducts() {
    try {
        console.log('Adding sample products...');
        
        // Get category IDs
        const categoriesSnapshot = await db.collection('categories').get();
        const categories = {};
        
        categoriesSnapshot.forEach(doc => {
            categories[doc.data().name] = doc.id;
        });
        
        const products = [
            {
                name: 'Smartphone X',
                price: 699.99,
                description: 'Latest smartphone with advanced features and high-performance camera.',
                imageUrl: 'https://source.unsplash.com/random/800x600/?smartphone',
                category: categories['Electronics'],
                featured: true,
                dateAdded: window.createTimestamp()
            },
            {
                name: 'Laptop Pro',
                price: 1299.99,
                description: 'Powerful laptop for professionals with high-speed processor and ample storage.',
                imageUrl: 'https://source.unsplash.com/random/800x600/?laptop',
                category: categories['Electronics'],
                featured: true,
                dateAdded: window.createTimestamp()
            },
            {
                name: 'Men\'s Casual Shirt',
                price: 39.99,
                description: 'Comfortable and stylish casual shirt for men.',
                imageUrl: 'https://source.unsplash.com/random/800x600/?shirt',
                category: categories['Clothing'],
                featured: false,
                dateAdded: window.createTimestamp()
            },
            {
                name: 'Women\'s Summer Dress',
                price: 59.99,
                description: 'Elegant summer dress with floral pattern.',
                imageUrl: 'https://source.unsplash.com/random/800x600/?dress',
                category: categories['Clothing'],
                featured: true,
                dateAdded: window.createTimestamp()
            },
            {
                name: 'Coffee Maker',
                price: 89.99,
                description: 'Automatic coffee maker for the perfect brew every morning.',
                imageUrl: 'https://source.unsplash.com/random/800x600/?coffeemaker',
                category: categories['Home & Kitchen'],
                featured: false,
                dateAdded: window.createTimestamp()
            },
            {
                name: 'Bestselling Novel',
                price: 19.99,
                description: 'The latest bestselling fiction novel that everyone is talking about.',
                imageUrl: 'https://source.unsplash.com/random/800x600/?book',
                category: categories['Books'],
                featured: false,
                dateAdded: window.createTimestamp()
            },
            {
                name: 'Yoga Mat',
                price: 29.99,
                description: 'High-quality yoga mat for your daily practice.',
                imageUrl: 'https://source.unsplash.com/random/800x600/?yogamat',
                category: categories['Sports & Outdoors'],
                featured: false,
                dateAdded: window.createTimestamp()
            },
            {
                name: 'Wireless Earbuds',
                price: 129.99,
                description: 'Premium wireless earbuds with noise cancellation.',
                imageUrl: 'https://source.unsplash.com/random/800x600/?earbuds',
                category: categories['Electronics'],
                featured: true,
                dateAdded: window.createTimestamp()
            }
        ];
        
        for (const product of products) {
            await db.collection('products').add(product);
        }
        
        console.log('Sample products added successfully!');
    } catch (error) {
        console.error('Error adding sample products:', error);
    }
}

// Function to run all seeding operations
async function seedDatabase() {
    await seedCategories();
    
    // Replace with your desired admin email, password, and name
    await createAdminUser('admin@shopfire.com', 'Admin123!', 'Admin User');
    
    await addSampleProducts();
    
    console.log('Database seeding completed!');
}

// Run the seeding
document.addEventListener('DOMContentLoaded', () => {
    const seedButton = document.getElementById('seed-button');
    
    if (seedButton) {
        seedButton.addEventListener('click', async () => {
            if (!window.db || !window.auth) {
                console.error('Firebase is not properly initialized');
                alert('Firebase is not properly initialized. Please check the console for errors.');
                return;
            }
            
            seedButton.disabled = true;
            seedButton.textContent = 'Seeding...';
            
            try {
                await seedDatabase();
                seedButton.textContent = 'Seeding Completed!';
            } catch (error) {
                console.error('Error during seeding:', error);
                seedButton.textContent = 'Seeding Failed';
            }
        });
    }
});