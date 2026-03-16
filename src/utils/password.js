// Utility helpers for password.
import bcrypt from 'bcrypt';

const COST = 10;

// Checks whether the current value has h password.
export async function hashPassword(plain) {
    return bcrypt.hash(plain, COST);
}

// Helper function used by verify password.
export async function verifyPassword(plain, hash) {
    return bcrypt.compare(plain, hash);
}