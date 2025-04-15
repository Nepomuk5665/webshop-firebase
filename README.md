# ShopFire - E-commerce Webshop with Firebase

ShopFire is a complete e-commerce webshop built using HTML, CSS, and JavaScript with Firebase integration. The application provides a frontend-only solution without requiring a Node.js backend.

## Features

- **User Authentication**: Email/password signup and login
- **Product Management**: View products, filter by categories, and sort by various criteria
- **Shopping Cart**: Add products, update quantities, and checkout
- **Order Management**: Place orders and track order status
- **Responsive Design**: Mobile and desktop-friendly interface
- **Admin Panel**: Manage products, categories, orders, users, and more
- **Newsletter Subscription**: Allow users to subscribe to a newsletter
- **Contact Form**: Let users send messages through a contact form

## Technical Stack

- HTML5
- CSS3 (with Grid and Flexbox)
- JavaScript (ES6+)
- Firebase
  - Authentication
  - Firestore Database
  - Storage
  - Hosting

## Setup Instructions

### Prerequisites

- Firebase CLI installed (`npm install -g firebase-tools`)
- Firebase account

### Installation

1. Clone this repository:
```
git clone https://github.com/yourusername/ShopFire.git
cd ShopFire
```

2. Create a new Firebase project:
   - Go to the [Firebase Console](https://console.firebase.google.com/)
   - Click "Add project" and follow the prompts to create a new project
   - Once created, click "Web" (</>) to add a web app to your project
   - Register the app with a nickname (e.g., "ShopFire Web")
   - Copy the Firebase configuration object

3. Update the Firebase configuration in `src/js/firebase-init.js` with your Firebase project details.

4. Enable Firebase services:
   - **Authentication**: Enable Email/Password sign-in method
   - **Firestore Database**: Create database in test mode
   - **Storage**: Create storage bucket with default settings

5. Log in to Firebase and select your project:
```
firebase login
firebase use --add
```
   - Select your newly created project when prompted

6. Deploy to Firebase:
```
firebase deploy
```

7. Initialize the database:
   - Navigate to `https://<your-project-id>.web.app/firestore-setup.html`
   - Follow the instructions on the page to seed the database with sample data
   - This will create sample categories, products, and an admin user (admin@shopfire.com / Admin123!)

## Project Structure

```
ShopFire/
├── src/                   # Source files
│   ├── index.html         # Homepage
│   ├── products.html      # Products page
│   ├── product-detail.html# Product detail page
│   ├── contact.html       # Contact page
│   ├── login.html         # Authentication page
│   ├── admin.html         # Admin dashboard
│   ├── firestore-setup.html # Database initializer
│   ├── css/               # CSS files
│   │   ├── styles.css     # Main styles
│   │   └── admin.css      # Admin dashboard styles
│   ├── js/                # JavaScript files
│   │   ├── firebase-init.js  # Firebase initialization 
│   │   ├── auth.js        # Authentication functions
│   │   ├── database.js    # Database operations
│   │   ├── main.js        # Main application logic
│   │   ├── products.js    # Products functionality
│   │   ├── product-detail.js # Product detail functionality
│   │   ├── contact.js     # Contact form functionality
│   │   ├── admin.js       # Admin dashboard functionality
│   │   └── firestore-setup.js # Database initialization script
│   └── images/            # Image assets
├── firebase.json          # Firebase configuration
├── firestore.rules        # Firestore security rules
├── firestore.indexes.json # Firestore indexes
├── storage.rules          # Storage security rules
└── README.md              # Project documentation
```

## Firestore Database Structure

- **Products**: Products available in the shop
- **Categories**: Product categories
- **Users**: User information
- **Orders**: Order details
- **Newsletter**: Newsletter subscribers
- **ContactMessages**: Messages from the contact form

## Security

- All pages except the login page are protected and require authentication
- Admin features are restricted to users with admin privileges
- Firestore security rules ensure proper data access control
- Storage rules restrict file uploads to admin users

## Admin Access

After initializing the database, you can access the admin panel with:
- Email: admin@shopfire.com
- Password: Admin123!
- Admin-Panel: https://webshop-5665.web.app/admin.html

## Customization

To customize the application:
1. Update the styles in `src/css/styles.css` and `src/css/admin.css`
2. Modify HTML templates in the `src` directory
3. Extend functionality by editing JavaScript files in the `src/js` directory

## Troubleshooting

- If you encounter issues with Firebase permissions, make sure you've properly set up Authentication, Firestore, and Storage services in the Firebase Console
- For deployment issues, check the Firebase CLI output for specific error messages
- If the database initialization fails, try manually creating the collections and documents from the Firebase Console

## License

MIT License
