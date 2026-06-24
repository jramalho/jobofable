import { Request, Response } from 'express';
import { jobSearchBodySchema } from '../schemas/jobSearch.schema';
import { searchUntrackedJobs } from '../services/jobSearch.service';
import { parseOrThrow } from '../utils/validate';

export async function searchJobs(req: Request, res: Response): Promise<void> {
  const body = parseOrThrow(jobSearchBodySchema, req.body, 'Invalid job-search payload.');
  console.log(`[job-search] keywords=${body.keywords.join(', ')} remoteOnly=${body.remoteOnly}`);
  res.status(200).json(await searchUntrackedJobs(body));
}
