import bcrypt from 'bcryptjs';
import { UserModel, CreateUserData } from '../models/userModel.js';
import { generateToken } from '../utils/jwt.js';

export class AuthService {
  static async register(data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role: 'FARMER' | 'OWNER';
    address: string;
    village: string;
    taluk: string;
    district: string;
    state: string;
    pincode: string;
  }) {
    // 1. Check existing email
    const existingEmail = await UserModel.findByEmail(data.email);
    if (existingEmail) {
      return {
        status: 409,
        success: false,
        message: 'Email already registered',
      };
    }

    // 2. Check existing phone
    const existingPhone = await UserModel.findByPhone(data.phone);
    if (existingPhone) {
      return {
        status: 409,
        success: false,
        message: 'Phone number already registered',
      };
    }

    // 3. Hash password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(data.password, saltRounds);

    // 4. Create user and profile in DB
    const createData: CreateUserData = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      password_hash,
      role: data.role,
      address: data.address,
      village: data.village,
      taluk: data.taluk,
      district: data.district,
      state: data.state,
      pincode: data.pincode,
    };

    const user = await UserModel.createWithProfile(createData);

    // 5. Generate JWT token
    const token = generateToken({
      id: user.id,
      role: user.role,
      email: user.email,
      name: user.name,
    });

    // Fetch complete user with role-specific profile (village, taluk, district, state)
    const fullUser = await UserModel.findWithProfile(user.id);

    return {
      status: 201,
      success: true,
      message: 'User registered successfully',
      token,
      user: fullUser || {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  static async login(email: string, password: string) {
    // 1. Find user by email
    const user = await UserModel.findByEmail(email);
    if (!user) {
      return {
        status: 401,
        success: false,
        message: 'Invalid email or password',
      };
    }

    // 2. Verify password with bcrypt
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return {
        status: 401,
        success: false,
        message: 'Invalid email or password',
      };
    }

    // 3. Check if active or suspended
    if (user.status === 'SUSPENDED') {
      return {
        status: 403,
        success: false,
        message: 'User account suspended. Please contact support.',
      };
    }

    if (!user.is_active || user.status === 'INACTIVE') {
      return {
        status: 403,
        success: false,
        message: 'Account is deactivated. Please contact support.',
      };
    }

    // 4. Generate JWT
    const token = generateToken({
      id: user.id,
      role: user.role,
      email: user.email,
      name: user.name,
    });

    // 5. Fetch complete user with role-specific profile (village, taluk, district, state)
    const fullUser = await UserModel.findWithProfile(user.id);

    return {
      status: 200,
      success: true,
      message: 'Login successful',
      token,
      user: fullUser || {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  static async getCurrentUser(userId: string) {
    const user = await UserModel.findWithProfile(userId);
    if (!user) {
      return {
        status: 404,
        success: false,
        message: 'User not found',
      };
    }

    return {
      status: 200,
      success: true,
      user,
    };
  }
}
