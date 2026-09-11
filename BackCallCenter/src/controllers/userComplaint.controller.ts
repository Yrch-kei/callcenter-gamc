import { Request, Response } from 'express';
import { UserComplaintService } from '../services/userComplaint.service';
import { stat } from 'fs';
import { AssignmentStatus } from '@models/userComplaint.entity';

const userComplaintService = new UserComplaintService();

export const assignComplaint = async (req: Request, res: Response): Promise<void> => {
  try {
    const authUserId = req.user?.id;
    const { complaintId, userId } = req.body;

    if (!complaintId || !userId) {
      res.status(400).json({ message: 'complaintId y userId son requeridos' });
      return;
    }

    const assignment = await userComplaintService.assignComplaint(
      Number(complaintId),
      Number(userId),
      Number(authUserId)
    );

    res.status(201).json(assignment);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const cancelAssignment = async (req: Request, res: Response): Promise<void> => {
  try {
    const authUserId = req.user?.id;
    const { reason } = req.body;
    const assignmentId = Number(req.params.id);

    const assignment = await userComplaintService.cancelAssignment(
      assignmentId,
      Number(authUserId),
      reason
    );

    res.status(200).json(assignment);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const completeAssignment = async (req: Request, res: Response): Promise<void> => {
  try {
    const authUserId = req.user?.id;
    const { notes } = req.body;
    const assignmentId = Number(req.params.id);

    const assignment = await userComplaintService.completeAssignment(
      assignmentId,
      Number(authUserId),
      notes
    );

    res.status(200).json(assignment);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getUserAssignments = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = Number(req.params.userId);
    const { status } = req.query;

    const assignments = await userComplaintService.getAssignmentsByUser(
      userId,
      status as AssignmentStatus | undefined
    );

    res.status(200).json(assignments);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getComplaintAssignments = async (req: Request, res: Response): Promise<void> => {
  try {
    const complaintId = Number(req.params.complaintId);
    const assignments = await userComplaintService.getAssignmentsByComplaint(complaintId);

    res.status(200).json(assignments);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};