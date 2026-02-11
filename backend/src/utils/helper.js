import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

//Generate JWT token

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}

export const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};


//Hash password

export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

//Compare password with hashed password

export const comparePassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

//Generate random alphanumeric string

export const generateRandomString = (length = 32) => {
  return crypto.randomBytes(length).toString('hex').slice(0, length);
};


//Format date to time string (HH:mm)

export const formatTimeString = (date) => {
  return date.toTimeString().slice(0, 5);
};

//Parse time string (HH:mm) to minutes

export const timeStringToMinutes = (timeString) => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};

//Check if two time slots overlap

export const timeSlotsOverlap = (start1, end1, start2, end2) => {
  const start1Minutes = timeStringToMinutes(start1);
  const end1Minutes = timeStringToMinutes(end1);
  const start2Minutes = timeStringToMinutes(start2);
  const end2Minutes = timeStringToMinutes(end2);

  return start1Minutes < end2Minutes && start2Minutes < end1Minutes;
};

//Generate time slots for a day

export const generateTimeSlots = (startTime, endTime, duration) => {
  const slots = [];
  let current = timeStringToMinutes(startTime);
  const end = timeStringToMinutes(endTime);

  while (current + duration <= end) {
    const hours = Math.floor(current / 60);
    const minutes = current % 60;
    const timeString = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    slots.push(timeString);
    current += duration;
  }

  return slots;
};

//Format full name from first and last name

export const formatFullName = (firstName, lastName) => {
  if (!firstName && !lastName) return 'Unknown';
  if (!lastName) return firstName;
  if (!firstName) return lastName;
  return `${firstName} ${lastName}`;
};

// Paginate results

export const paginate = (page = 1, limit = 10) => {
  const safePage = Math.max(1, Number(page));
  const safeLimit = Math.max(1, Number(limit));
  const skip = (safePage - 1) * safeLimit;

  return { skip, take: safeLimit };
};


//Generate pagination metadata

export const paginationMeta = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
};