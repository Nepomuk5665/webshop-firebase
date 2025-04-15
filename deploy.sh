#!/bin/bash

echo "========================================="
echo "ShopFire Firebase Deployment Script"
echo "========================================="

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "ERROR: Firebase CLI not found!"
    echo "Please install with: npm install -g firebase-tools"
    exit 1
fi

# Login to Firebase if not already logged in
echo "Checking Firebase login status..."
firebase projects:list > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "You need to log in to Firebase first."
    firebase login
fi

# Check if .firebaserc exists
if [ ! -f .firebaserc ]; then
    echo "No .firebaserc file found. Let's set up your project."
    echo "Please select your Firebase project or create a new one:"
    firebase use --add
fi

# Validate Firebase files
echo "Validating Firebase configuration..."
firebase apps:list

# Deploy to Firebase
echo "Deploying to Firebase..."
firebase deploy

if [ $? -eq 0 ]; then
    echo "========================================="
    echo "Deployment completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Visit your deployed site at: https://$(grep -o '"default": "[^"]*' .firebaserc | cut -d '"' -f 4).web.app"
    echo "2. Go to the initialize page to set up your database: https://$(grep -o '"default": "[^"]*' .firebaserc | cut -d '"' -f 4).web.app/initialize.html"
    echo "3. Log in with the admin account (admin@shopfire.com / Admin123!)"
    echo "========================================="
else
    echo "Deployment failed. Please check the error messages above."
    exit 1
fi