import { analysisSchema, reportSchema, type Analysis, type Report, type Submission } from '../../../shared/interview';
import { z } from 'zod';
export interface AppConfig {aiConfigured:boolean;premiumMode:boolean;paymentLink:string;}
const base=(import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
const configSchema=z.object({aiConfigured:z.boolean(),premiumMode:z.boolean(),paymentLink:z.union([z.literal(''),z.url().refine(value=>new URL(value).protocol==='https:')])});
export async function getConfig():Promise<AppConfig>{
  const response=await fetch(`${base}/api/config`,{signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw new Error('Unable to connect to the server.');
  return configSchema.parse(await response.json());
}
export async function generate<T extends Analysis | Report>(input:Submission,full=false,accessCode=''):Promise<T> {
  const data=new FormData();
  data.append('resume',input.resume);data.append('jobDescription',input.jobDescription);data.append('targetRole',input.targetRole);data.append('experience',input.experience);
  if(accessCode)data.append('accessCode',accessCode);
  try {
    const response=await fetch(`${base}/api/v1/interview/${full?'full-report':'analyze'}`,{method:'POST',body:data,signal:AbortSignal.timeout(250000)});
    const result:unknown=await response.json().catch(error=>{if(error instanceof SyntaxError)return null;throw error;});
    if(!response.ok){
      const message=result && typeof result==='object' && 'error' in result && typeof result.error==='string' ? result.error : 'Unable to generate the report. Please try again.';
      throw new Error(message);
    }
    const parsed=(full?reportSchema:analysisSchema).safeParse(result);
    if(!parsed.success)throw new Error('The server returned an incomplete report. Please try again.');
    return parsed.data as T;
  } catch(error) {
    if(error instanceof DOMException && ['TimeoutError','AbortError'].includes(error.name))throw new Error('The request timed out. Please try again.');
    if(error instanceof TypeError)throw new Error('Unable to connect to the server. Check your connection and try again.');
    throw error;
  }
}
