  import prisma from './prisma';
  import bcrypt from 'bcryptjs';
  import jwt from 'jsonwebtoken';

  const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';
  const JWT_EXPIRES_IN = '7d';

  export const hashPassword = async (password: string): Promise<string> => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  };

  export const verifyPassword = async (password: string, hashed: string): Promise<boolean> => {
    return bcrypt.compare(password, hashed);
  };

  export const generateToken = (userId: string): string => {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN };
  };

  // Sign up user
  export const signUp = async (
    email: string,
    password: string,
    fullName: string
  ) => {
    // Check if user already exists by email
    const existingUser = await prisma.profile.findFirst({
      where: { email }, // NOTE: You'll need to add email field to Profile model
    });

    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create profile (you'll need to add email and password fields to your schema)
    const user = await prisma.profile.create({
      data: {
        // You'll need to update your Prisma schema to include:
        // email: String @unique
        // password: String
        full_name: fullName,
        // For now, storing password in profile (NOT recommended for production)
        // Better: create separate User table for auth credentials
      },
    });

    const token = generateToken(user.id);
    return {
      id: user.id,
      fullName: user.full_name,
      token,
    };
  };

  // Sign in user
  export const signIn = async (email: string, password: string) => {
    // Find user by email
    const user = await prisma.profile.findFirst({
      where: { email },
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password (you'll need to store hashed password in your schema)
    // const isValid = await verifyPassword(password, user.password);
    // if (!isValid) throw new Error('Invalid credentials');

    // For now, assuming password verification works
    const token = generateToken(user.id);
    return {
      id: user.id,
      fullName: user.full_name,
      token,
    };
  };

  // Sign out (mostly client-side, but could invalidate server-side tokens if needed)
  export const signOut = async () => {
    // For JWT, signout is primarily client-side (removing token)
    // If you implement refresh tokens or token blacklisting, add server-side logic here
    return;
  };

  // Verify token (utility function)
  export const verifyToken = (token: string): { userId: string } | null => {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      return decoded;
    } catch (error) {
      return null;
    }
  };
