import type { Analysis, InterviewInput, Report } from '../../../shared/interview.js';
export interface AiService {analyze(input:InterviewInput,resume:string):Promise<Analysis>; fullReport(input:InterviewInput,resume:string):Promise<Report>;}
