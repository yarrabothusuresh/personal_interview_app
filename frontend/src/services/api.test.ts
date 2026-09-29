import { afterEach, describe, expect, it, vi } from 'vitest';
import { generate, getConfig } from './api';
import { sampleAnalysis } from '../data/sample';
import type { Submission } from '../../../shared/interview';

const input:Submission={resume:new File(['Synthetic resume'], 'resume.txt'),jobDescription:'A synthetic job description',targetRole:'Java Developer',experience:'10–15 years'};
afterEach(()=>vi.unstubAllGlobals());

describe('generation responses',()=>{
  it('preserves timeout errors while reading the response body',async()=>{
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:()=>Promise.reject(new DOMException('aborted','TimeoutError'))}));
    await expect(generate(input)).rejects.toThrow('timed out');
  });
  it('rejects invalid public configuration',async()=>{
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue(Response.json({aiConfigured:true,premiumMode:'false',paymentLink:'javascript:alert(1)'})));
    await expect(getConfig()).rejects.toThrow();
  });
  it('returns validated analysis',async()=>{
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue(Response.json(sampleAnalysis)));
    expect(await generate(input)).toEqual(sampleAnalysis);
  });
  it('preserves actionable API errors',async()=>{
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue(Response.json({error:'A verified premium access code is required.'},{status:402})));
    await expect(generate(input,true)).rejects.toThrow('verified premium access code');
  });
  it('handles HTML gateway errors without exposing parsing errors',async()=>{
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response('<html>Bad gateway</html>',{status:502})));
    await expect(generate(input)).rejects.toThrow('Unable to generate the report');
  });
  it.each([null,{}, {matchScore:100}])('rejects incomplete successful responses: %j',async result=>{
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue(Response.json(result)));
    await expect(generate(input)).rejects.toThrow('incomplete report');
  });
  it('requires full report fields on the full-report endpoint',async()=>{
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue(Response.json(sampleAnalysis)));
    await expect(generate(input,true)).rejects.toThrow('incomplete report');
  });
  it('explains connection failures',async()=>{
    vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new TypeError('fetch failed')));
    await expect(generate(input)).rejects.toThrow('Check your connection');
  });
  it('explains timeouts',async()=>{
    vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new DOMException('aborted','TimeoutError')));
    await expect(generate(input)).rejects.toThrow('timed out');
  });
});
