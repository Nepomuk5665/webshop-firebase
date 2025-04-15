// Firestore Setup Script
// Using globally defined Firebase services from firebase-init.js

// DOM Elements
const statusElement = document.getElementById('setup-status');
const logElement = document.getElementById('setup-log');
const adminUserBtn = document.getElementById('create-admin-user');
const categoriesBtn = document.getElementById('create-categories');
const productsBtn = document.getElementById('create-products');
const runAllBtn = document.getElementById('run-all');

// Helper function to log messages
function log(message, isError = false) {
  const entry = document.createElement('div');
  entry.textContent = message;
  if (isError) {
    entry.style.color = '#dc3545';
  }
  logElement.appendChild(entry);
  logElement.scrollTop = logElement.scrollHeight;
  console.log(message);
}

// Update status
function updateStatus(message) {
  statusElement.textContent = message;
}

// Create admin user
async function createAdminUser() {
  try {
    updateStatus('Creating admin user...');
    log('Creating admin user...');

    // Check if admin user already exists
    const userEmail = 'admin@shopfire.com';
    const userPassword = 'Admin123!';
    
    try {
      // First, try to get user by email from Firestore
      const usersSnapshot = await db.collection('users')
        .where('email', '==', userEmail)
        .limit(1)
        .get();
      
      if (!usersSnapshot.empty) {
        // User exists in Firestore, make sure they're an admin
        const userDoc = usersSnapshot.docs[0];
        const userData = userDoc.data();
        
        // Update user data to ensure admin flag is set
        await db.collection('users').doc(userDoc.id).set({
          name: 'Admin User',
          email: userEmail,
          isAdmin: true,
          createdAt: userData.createdAt || window.createTimestamp()
        }, { merge: true });
        
        log('Updated existing user to admin status.');
        return true;
      }

      // If no user found in Firestore, try to sign in
      await auth.signInWithEmailAndPassword(userEmail, userPassword);
      log('Admin user authenticated.');
      
      // Add admin flag in Firestore
      const user = auth.currentUser;
      await db.collection('users').doc(user.uid).set({
        name: 'Admin User',
        email: userEmail,
        isAdmin: true,
        createdAt: window.createTimestamp()
      }, { merge: true });
      
      log('Updated admin user data.');
      return true;
    } catch (error) {
      // If signin fails, create the admin user
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-login-credentials') {
        log(`Admin user doesn't exist. Creating a new admin user...`);
        try {
          const userCredential = await auth.createUserWithEmailAndPassword(userEmail, userPassword);
          
          await db.collection('users').doc(userCredential.user.uid).set({
            name: 'Admin User',
            email: userEmail,
            isAdmin: true,
            createdAt: window.createTimestamp()
          });
          
          log('Admin user created successfully!');
          return true;
        } catch (createError) {
          throw new Error(`Failed to create admin user: ${createError.message}`);
        }
      } else {
        throw error;
      }
    }
  } catch (error) {
    log(`Error creating admin user: ${error.message}`, true);
    return false;
  }
}

// Create categories
async function createCategories() {
  try {
    updateStatus('Creating categories...');
    log('Creating categories...');
    
    // Check if categories already exist
    const categoriesSnapshot = await db.collection('categories').limit(1).get();
    if (!categoriesSnapshot.empty) {
      log('Categories already exist, skipping creation.');
      return true;
    }
    
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
    
    const batch = db.batch();
    
    categories.forEach(category => {
      const categoryRef = db.collection('categories').doc();
      batch.set(categoryRef, category);
    });
    
    await batch.commit();
    log(`Created ${categories.length} categories successfully!`);
    return true;
  } catch (error) {
    log(`Error creating categories: ${error.message}`, true);
    return false;
  }
}

// Create products
async function createProducts() {
  try {
    updateStatus('Creating products...');
    log('Creating products...');
    
    // Check if products already exist
    const productsSnapshot = await db.collection('products').limit(1).get();
    if (!productsSnapshot.empty) {
      log('Products already exist, skipping creation.');
      return true;
    }
    
    // Get category IDs
    const categoriesSnapshot = await db.collection('categories').get();
    
    if (categoriesSnapshot.empty) {
      log('No categories found. Please create categories first.', true);
      return false;
    }
    
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
        dateAdded: timestamp()
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
        dateAdded: timestamp()
      },
      {
        name: 'Bestselling Novel',
        price: 19.99,
        description: 'The latest bestselling fiction novel that everyone is talking about.',
        imageUrl: 'https://source.unsplash.com/random/800x600/?book',
        category: categories['Books'],
        featured: false,
        dateAdded: timestamp()
      },
      {
        name: 'Yoga Mat',
        price: 29.99,
        description: 'High-quality yoga mat for your daily practice.',
        imageUrl: 'https://source.unsplash.com/random/800x600/?yogamat',
        category: categories['Sports & Outdoors'],
        featured: false,
        dateAdded: timestamp()
      },
      {
        name: 'Wireless Earbuds',
        price: 129.99,
        description: 'Premium wireless earbuds with noise cancellation.',
        imageUrl: 'https://source.unsplash.com/random/800x600/?earbuds',
        category: categories['Electronics'],
        featured: true,
        dateAdded: window.createTimestamp()
      },
      {
        name: 'Smart Watch',
        price: 249.99,
        description: 'Track your fitness and stay connected with this advanced smartwatch.',
        imageUrl: 'https://source.unsplash.com/random/800x600/?smartwatch',
        category: categories['Electronics'],
        featured: true,
        dateAdded: window.createTimestamp()
      },
      {
        name: 'Blender',
        price: 79.99,
        description: 'High-powered blender for smoothies and food preparation.',
        imageUrl: 'https://source.unsplash.com/random/800x600/?blender',
        category: categories['Home & Kitchen'],
        featured: true,
        dateAdded: window.createTimestamp()
      },
      {
        name: 'Hiking Backpack',
        price: 89.99,
        description: 'Durable and comfortable backpack for hiking and outdoor adventures.',
        imageUrl: 'https://source.unsplash.com/random/800x600/?backpack',
        category: categories['Sports & Outdoors'],
        featured: true,
        dateAdded: window.createTimestamp()
      },
      {
        name: 'Cookbook',
        price: 24.99,
        description: 'Collection of delicious recipes from around the world.',
        imageUrl: 'https://source.unsplash.com/random/800x600/?cookbook',
        category: categories['Books'],
        featured: true,
        dateAdded: window.createTimestamp()
      }
    ];
    
    const batch = db.batch();
    
    products.forEach(product => {
      const productRef = db.collection('products').doc();
      batch.set(productRef, product);
    });
    
    await batch.commit();
    log(`Created ${products.length} products successfully!`);
    return true;
  } catch (error) {
    log(`Error creating products: ${error.message}`, true);
    return false;
  }
}

// Run all setup
async function runAllSetup() {
  updateStatus('Running complete setup...');
  
  runAllBtn.disabled = true;
  adminUserBtn.disabled = true;
  categoriesBtn.disabled = true;
  productsBtn.disabled = true;
  
  try {
    // Create admin user
    const adminCreated = await createAdminUser();
    if (!adminCreated) {
      log('Failed to create admin user. Continuing with other setups...', true);
    }
    
    // Create categories
    const categoriesCreated = await createCategories();
    if (!categoriesCreated) {
      log('Failed to create categories. Stopping setup.', true);
      updateStatus('Setup incomplete.');
      enableButtons();
      return;
    }
    
    // Create products
    const productsCreated = await createProducts();
    if (!productsCreated) {
      log('Failed to create products.', true);
      updateStatus('Setup incomplete.');
      enableButtons();
      return;
    }
    
    updateStatus('Setup complete!');
    log('All setup steps completed successfully!');
  } catch (error) {
    log(`Setup failed: ${error.message}`, true);
    updateStatus('Setup failed.');
  } finally {
    enableButtons();
  }
}

// Enable buttons
function enableButtons() {
  runAllBtn.disabled = false;
  adminUserBtn.disabled = false;
  categoriesBtn.disabled = false;
  productsBtn.disabled = false;
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  if (!window.db || !window.auth) {
    log('Firebase is not properly initialized. Please check for errors in the console.', true);
    updateStatus('Firebase initialization error');
    return;
  }

  if (adminUserBtn) adminUserBtn.addEventListener('click', createAdminUser);
  if (categoriesBtn) categoriesBtn.addEventListener('click', createCategories);
  if (productsBtn) productsBtn.addEventListener('click', createProducts);
  if (runAllBtn) runAllBtn.addEventListener('click', runAllSetup);

  log('Firestore setup page loaded.');
  log('You can now create your admin user, categories, and sample products.');
});