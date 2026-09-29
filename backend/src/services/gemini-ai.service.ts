import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { analysisSchema, reportSchema, type InterviewInput } from '../../../shared/interview.js';
import { config } from '../config.js';
import { ApiError } from '../errors.js';
import { interviewPrompt, systemPrompt } from '../prompts/interview.prompt.js';
import type { AiService } from './ai.service.js';
export class GeminiAiService implements AiService {
  analyze(input:InterviewInput,resume:string){return this.generate(input,resume,false,analysisSchema);}
  fullReport(input:InterviewInput,resume:string){return this.generate(input,resume,true,reportSchema);}
  private async generate<T>(input:InterviewInput,resume:string,full:boolean,schema:z.ZodType<T>):Promise<T> {
    if(!config.apiKey) throw new ApiError(503,'AI generation is not configured yet. Add GEMINI_API_KEY on the server, or explore the sample report.');
    const client=new GoogleGenAI({apiKey:config.apiKey,httpOptions:{timeout:config.timeout,retryOptions:{attempts:1}}});
    const started=Date.now();
    let repair='';
    for(let attempt=0;attempt<2;attempt++) {
      try {
        const remaining=config.timeout-(Date.now()-started);
        if(remaining<1000) throw new Error('timeout');
        const response=await client.models.generateContent({model:config.model,contents:interviewPrompt(input,resume,full)+repair,config:{systemInstruction:systemPrompt,responseMimeType:'application/json',responseJsonSchema:z.toJSONSchema(schema),maxOutputTokens:full?32768:4096,temperature:0.35,httpOptions:{timeout:remaining},abortSignal:AbortSignal.timeout(remaining)}});
        return schema.parse(JSON.parse(response.text || ''));
      } catch(error) {
        const invalid=error instanceof z.ZodError || error instanceof SyntaxError;
        // Do not log provider error objects: they can contain request data.
        console.warn(JSON.stringify({event:'ai_attempt',attempt:attempt+1,status:invalid?'invalid_response':'provider_error'}));
        repair=invalid?'\nThe previous response failed validation. Recreate the complete JSON carefully, satisfying all lengths, unique questions, exact priority references, and distinct days.':'';
      }
    }
    throw new ApiError(502,'AI service is temporarily unavailable or returned an incomplete report. Please try again.');
  }
}
