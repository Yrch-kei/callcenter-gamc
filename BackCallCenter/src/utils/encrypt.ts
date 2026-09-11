import bcrypt from 'bcryptjs';

export const encryptPassword = async (password: string): Promise<string> => {
  const saltRounds = 10; // Número de rondas para generar el salt
  const salt = await bcrypt.genSalt(saltRounds); // Generar el salt
  const hashedPassword = await bcrypt.hash(password, salt); // Encriptar la contraseña
  return hashedPassword;
};

export async function comparePassword(plainText: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}