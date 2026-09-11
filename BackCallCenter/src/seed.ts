import { AppDataSource } from "./config/db";
import { User } from "./models/user.entity";
// Importa otras entidades

async function seed() {
  await AppDataSource.initialize();
  
  // Ejemplo de datos de prueba
  const user = new User();
  user.names = "Usuario";
  user.lastname = "Prueba";
  // Completa otros campos...
  
  await AppDataSource.manager.save(user);
  
  console.log("Datos de prueba insertados!");
  await AppDataSource.destroy();
}

seed().catch(console.error);