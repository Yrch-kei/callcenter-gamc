import { Request, Response } from 'express';
import { AppDataSource } from '../config/db';
import { PushSubscription } from '../models/pushSubscription.entity';
import { vapidPublicKey } from '../utils/push';

export const getPublicKey = (_req: Request, res: Response) => {
  res.json({ publicKey: vapidPublicKey });
};

export const subscribe = async (req: Request, res: Response) => {
  try {
    const user = req.user as { id: number };
    if (!user || !user.id) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    const { subscription, endpoint, keys } = req.body;
    
    const subObj = subscription || { endpoint, keys };
    const targetEndpoint = subObj?.endpoint;
    const p256dh = subObj?.keys?.p256dh;
    const authKey = subObj?.keys?.auth;

    if (!targetEndpoint || !p256dh || !authKey) {
      res.status(400).json({ error: 'Formato de suscripción Push inválido' });
      return;
    }

    const repo = AppDataSource.getRepository(PushSubscription);
    
    let existing = await repo.findOne({ where: { endpoint: targetEndpoint } });
    if (existing) {
      existing.userId = user.id;
      existing.p256dh = p256dh;
      existing.auth = authKey;
      await repo.save(existing);
    } else {
      const newSub = repo.create({
        userId: user.id,
        endpoint: targetEndpoint,
        p256dh,
        auth: authKey
      });
      await repo.save(newSub);
    }

    res.status(201).json({ success: true, message: 'Suscripción Push guardada correctamente' });
  } catch (error: any) {
    console.error('Error al guardar suscripción Push:', error);
    res.status(500).json({ error: 'Error interno al guardar suscripción Push' });
  }
};
