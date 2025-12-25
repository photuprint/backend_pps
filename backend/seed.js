import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/user.model.js';

dotenv.config({
    path: './.env'
});

const createTestAdmin = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: 'admin@photuprint.com' });
        if (existingAdmin) {
            console.log('Admin user already exists');
            process.exit(0);
        }

        // Create test admin user
        const adminUser = new User({
            name: 'Admin User',
            email: 'admin@photuprint.com',
            password: 'admin123',
            role: 'admin'
        });

        await adminUser.save();
        console.log('Test admin user created successfully!');
        console.log('Email: admin@photuprint.com');
        console.log('Password: admin123');
        
        process.exit(0);
    } catch (error) {
        console.error('Error creating admin user:', error);
        process.exit(1);
    }
};

createTestAdmin(); 
