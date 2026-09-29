import { describe,it,expect,vi } from 'vitest';
import request from 'supertest';
import { jsPDF } from 'jspdf';
import { createApp } from '../src/app.js';
import { ResumeParserService } from '../src/services/resume-parser.service.js';
import { analysisSchema, inputSchema, reportSchema, questionSections } from '../../shared/interview.js';
import { sampleAnalysis, sampleReport } from '../../frontend/src/data/sample.js';

const resume='Senior Java engineer with 10+ years of experience in Java, Spring Boot, Microservices, Kafka, Oracle and REST APIs.';
const jd='Senior Java Developer required: Java 17+, Spring Boot, Microservices, Kafka, Docker, Kubernetes, AWS, REST APIs, CI/CD and Generative AI exposure.';
const values={jobDescription:jd,targetRole:'Senior Java Developer',experience:'10–15 years'};
const mockAi={analyze:vi.fn().mockResolvedValue(sampleAnalysis),fullReport:vi.fn().mockResolvedValue(sampleReport)};
const file=(name:string,buffer:Buffer,mimetype='text/plain')=>({originalname:name,buffer,size:buffer.length,mimetype} as Express.Multer.File);
describe('resume parsing',()=>{
 const parser=new ResumeParserService();
 it('extracts UTF-8 TXT without storing a file',async()=>expect(await parser.parse(file('resume.txt',Buffer.from(resume)))).toBe(resume));
 it('extracts actual PDF text',async()=>{const pdf=new jsPDF();pdf.text(resume,12,20,{maxWidth:170});expect(await parser.parse(file('resume.pdf',Buffer.from(pdf.output('arraybuffer')),'application/pdf'))).toContain('Spring Boot');});
 it('rejects missing, empty, unsupported and oversized uploads',async()=>{await expect(parser.parse(undefined)).rejects.toThrow('upload');await expect(parser.parse(file('empty.txt',Buffer.alloc(0)))).rejects.toThrow('empty');await expect(parser.parse(file('bad.exe',Buffer.from(resume)))).rejects.toThrow('PDF or TXT');await expect(parser.parse(file('big.txt',Buffer.alloc(5*1024*1024+1)))).rejects.toThrow('5 MB');});
 it('rejects corrupt PDF, binary TXT, and excessive resume text',async()=>{await expect(parser.parse(file('bad.pdf',Buffer.from('not pdf'),'application/pdf'))).rejects.toThrow();await expect(parser.parse(file('bad.txt',Buffer.from([0,1,2])))).rejects.toThrow();await expect(parser.parse(file('big.txt',Buffer.from('a'.repeat(20001))))).rejects.toThrow('20,000');});
});
describe('schemas',()=>{
 it('validates job description and experience',()=>{expect(inputSchema.safeParse(values).success).toBe(true);expect(inputSchema.safeParse({...values,jobDescription:'too short'}).success).toBe(false);expect(inputSchema.safeParse({...values,experience:'unknown'}).success).toBe(false);expect(inputSchema.safeParse({...values,jobDescription:'a'.repeat(12001)}).success).toBe(false);});
 it('validates AI output and rejects invalid scores or incomplete questions',()=>{expect(analysisSchema.safeParse(sampleAnalysis).success).toBe(true);expect(analysisSchema.safeParse({...sampleAnalysis,matchScore:101}).success).toBe(false);expect(analysisSchema.safeParse({...sampleAnalysis,sampleQuestions:[{}]}).success).toBe(false);});
 it('validates full report completeness and uniqueness',()=>{const full=structuredClone(sampleReport);for(const [key] of questionSections){const length=key==='resumeBasedQuestions'?10:key==='systemDesignQuestions'||key==='behavioralQuestions'?5:full[key].length;full[key]=Array.from({length},(_,i)=>({...full[key][0],question:`${key} scenario ${i+1}`}));}full.mostLikelyQuestions=full.resumeBasedQuestions.map(q=>q.question);expect(reportSchema.safeParse(full).success).toBe(true);full.studyPlan[6].day=1;expect(reportSchema.safeParse(full).success).toBe(false);});
});
describe('API',()=>{
 it('reports health and safe public configuration',async()=>{const app=createApp(mockAi);expect((await request(app).get('/api/health')).body.status).toBe('ok');const response=await request(app).get('/api/config');expect(response.body).not.toHaveProperty('apiKey');expect(response.headers['cache-control']).toBe('no-store');});
 it('runs the required Java scenario through multipart parsing to AI and response',async()=>{const response=await request(createApp(mockAi)).post('/api/v1/interview/analyze').field(values).attach('resume',Buffer.from(resume),'resume.txt');expect(response.status).toBe(200);expect(response.body.strongSkills).toContain('Kafka');expect(response.body.missingSkills).toContain('Kubernetes');expect(response.body.analysisId).toBeTruthy();expect(mockAi.analyze).toHaveBeenCalledWith(values,resume);});
 it('rejects short JD before invoking AI',async()=>{const analyze=vi.fn();const response=await request(createApp({...mockAi,analyze})).post('/api/v1/interview/analyze').field({...values,jobDescription:'short'}).attach('resume',Buffer.from(resume),'resume.txt');expect(response.status).toBe(400);expect(analyze).not.toHaveBeenCalled();});
 it('enforces premium access server-side',async()=>{const fullReport=vi.fn().mockResolvedValue(sampleReport);const app=createApp({...mockAi,fullReport},{premium:true,accessCode:'test-access-code'});const denied=await request(app).post('/api/v1/interview/full-report').field(values).attach('resume',Buffer.from(resume),'resume.txt');expect(denied.status).toBe(402);expect(fullReport).not.toHaveBeenCalled();const allowed=await request(app).post('/api/v1/interview/full-report').field({...values,accessCode:'test-access-code'}).attach('resume',Buffer.from(resume),'resume.txt');expect(allowed.status).toBe(200);});
 it('limits AI requests per IP',async()=>{const app=createApp(mockAi);for(let i=0;i<10;i++)await request(app).post('/api/v1/interview/analyze');expect((await request(app).post('/api/v1/interview/analyze')).status).toBe(429);});
});
