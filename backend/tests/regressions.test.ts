import { describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { reportSchema, questionSections } from '../../shared/interview.js';
import { sampleReport } from '../../frontend/src/data/sample.js';

function completeReport(){
  const report=structuredClone(sampleReport);
  for(const [key] of questionSections){
    const length=key==='resumeBasedQuestions'?10:key==='systemDesignQuestions'||key==='behavioralQuestions'?5:report[key].length;
    report[key]=Array.from({length},(_,i)=>({...report[key][0],question:`${key} scenario ${i+1}`}));
  }
  report.mostLikelyQuestions=report.resumeBasedQuestions.map(q=>q.question);
  return report;
}

describe('priority references',()=>{
  it.each(['case','whitespace'])('rejects repeated references disguised by %s',variant=>{
    const report=completeReport();
    expect(reportSchema.safeParse(report).success).toBe(true);
    report.mostLikelyQuestions[1]=variant==='case'?report.mostLikelyQuestions[0].toUpperCase():` ${report.mostLikelyQuestions[0]} `;
    const result=reportSchema.safeParse(report);
    expect(result.success).toBe(false);
    if(!result.success)expect(result.error.issues.map(issue=>issue.message)).toContain('Priority questions must reference ten distinct report questions.');
  });
});

describe('premium request validation',()=>{
  it('rejects a request without multipart fields as unauthorized',async()=>{
    const ai={analyze:vi.fn(),fullReport:vi.fn()};
    const response=await request(createApp(ai,{premium:true,accessCode:'test-only-code'})).post('/api/v1/interview/full-report');
    expect(response.status).toBe(402);
    expect(response.body.error).toContain('verified premium access code');
    expect(ai.fullReport).not.toHaveBeenCalled();
  });
});
