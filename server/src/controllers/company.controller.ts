import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export const getCompanies = async (req: AuthRequest, res: Response) => {
  try {
    const { search } = req.query;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { address: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const companies = await prisma.company.findMany({
      where,
      include: {
        _count: { select: { students: true } }
      },
      orderBy: { name: 'asc' }
    });

    res.json({ companies });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch companies', error });
  }
};

export const getCompanyById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        students: {
          include: {
            user: { select: { name: true, email: true } }
          }
        }
      }
    });

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    res.json({ company });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch company', error });
  }
};

export const createCompany = async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      address,
      contactPerson,
      contactEmail,
      contactNumber,
      latitude,
      longitude,
      radiusMeters
    } = req.body;

    const company = await prisma.company.create({
      data: {
        name,
        address,
        contactPerson,
        contactEmail,
        contactNumber,
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
        radiusMeters: radiusMeters ? parseInt(radiusMeters) : 100
      }
    });

    res.status(201).json({ company });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create company', error });
  }
};

export const updateCompany = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (updateData.latitude) updateData.latitude = parseFloat(updateData.latitude);
    if (updateData.longitude) updateData.longitude = parseFloat(updateData.longitude);
    if (updateData.radiusMeters) updateData.radiusMeters = parseInt(updateData.radiusMeters);

    const company = await prisma.company.update({
      where: { id },
      data: updateData
    });

    res.json({ company });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update company', error });
  }
};

export const deleteCompany = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.company.delete({ where: { id } });

    res.json({ message: 'Company deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete company', error });
  }
};