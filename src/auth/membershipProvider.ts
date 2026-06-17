import { Request, Response, NextFunction } from 'express';
import { pool } from '../db/pool';

// Austauschbarer Rand: prüft Projekt-Mitgliedschaft.
// Default-Implementierung fragt unsere eigenen project_members-Tabellen.
// Falls Team 4/5 später eine API liefern, wird nur isMember() ersetzt.

export interface MembershipProvider {
  isMember(userSub: string, projectId: number): Promise<boolean>;
}

export const dbMembershipProvider: MembershipProvider = {
  async isMember(userSub: string, projectId: number): Promise<boolean> {
    const { rowCount } = await pool.query(
      'SELECT 1 FROM project_members WHERE project_id = $1 AND user_sub = $2',
      [projectId, userSub]
    );
    return (rowCount ?? 0) > 0;
  },
};

let provider: MembershipProvider = dbMembershipProvider;
export function setMembershipProvider(p: MembershipProvider): void {
  provider = p;
}

// Express-Middleware: erwartet :projectId in den Route-Params und prüft Zugriff.
export async function requireProjectMember(req: Request, res: Response, next: NextFunction): Promise<void> {
  const sub = req.user?.sub;
  const projectId = Number(req.params.projectId);
  if (!sub) {
    res.status(401).json({ error: 'Nicht authentifiziert' });
    return;
  }
  if (!Number.isInteger(projectId)) {
    res.status(400).json({ error: 'Ungültige projectId' });
    return;
  }
  const ok = await provider.isMember(sub, projectId);
  if (!ok) {
    res.status(403).json({ error: 'Kein Mitglied dieses Projekts' });
    return;
  }
  next();
}
