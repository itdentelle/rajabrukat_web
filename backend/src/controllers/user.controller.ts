import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma, JWT_SECRET } from '../config/database';

export const getProfile = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.id) return res.status(400).json({ error: 'Invalid user session' });

    const userProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, name: true, email: true, phone: true, address: true, role: true },
    });

    if (!userProfile) return res.status(404).json({ error: 'User not found' });

    res.json(userProfile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.id) return res.status(400).json({ error: 'Invalid user session' });

    const { phone, address } = req.body;

    const updatedProfile = await prisma.user.update({
      where: { id: user.id },
      data: { phone, address },
      select: { id: true, name: true, email: true, phone: true, address: true, role: true },
    });

    res.json(updatedProfile);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

export const updateAdminSettings = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access Denied: Admins Only' });
    }

    const { email, password } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser && existingUser.id !== user.id) {
      return res.status(400).json({ error: 'Email is already in use by another account' });
    }

    const dataToUpdate: any = { email };
    if (password && password.trim() !== '') {
      dataToUpdate.password = await bcrypt.hash(password, 10);
    }

    const updatedAdmin = await prisma.user.update({
      where: { id: user.id },
      data: dataToUpdate,
    });

    const token = jwt.sign(
      { id: updatedAdmin.id, email: updatedAdmin.email, role: updatedAdmin.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({
      message: 'Settings updated successfully',
      token,
      user: {
        id: updatedAdmin.id,
        name: updatedAdmin.name,
        email: updatedAdmin.email,
        role: updatedAdmin.role,
      },
    });
  } catch (error) {
    console.error('Error updating admin settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
};
