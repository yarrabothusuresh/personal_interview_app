import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import multer from 'multer';
import { rateLimit } from 'express-rate-limit';
import { randomUUID, timingSafeEqual, createHash } from 'node:crypto';
import { ZodError } from 'zod';
import { inputSchema } from '../../shared/interview.js';
import { config } from './config.js';
import { ApiError } from './errors.js';
import { GeminiAiService } from './services/gemini-ai.service.js';
import type { AiService } from './services/ai.service.js';
import { ResumeParserService } from './services/resume-parser.service.js';

export function createApp(ai:AiService=new GeminiAiService(), options={premium:config.premium,accessCode:config.accessCode}) {
  const app=express();
  app.disable('x-powered-by');
  if(config.trustProxy) app.set('trust proxy',config.trustProxy);
  app.use(helmet());
  app.use(cors({origin:config.frontendUrl,methods:['GET','POST']}));
  app.use((req,res,next)=>{res.locals.requestId=randomUUID();res.setHeader('X-Request-Id',res.locals.requestId);res.setHeader('Cache-Control','no-store');next();});
  app.get('/api/health',(_req,res)=>res.json({status:'ok',service:'InterviewPrep AI'}));
  app.get('/api/config',(_req,res)=>res.json({aiConfigured:Boolean(config.apiKey),premiumMode:options.premium,paymentLink:config.paymentLink}));
  const limiter=rateLimit({windowMs:60*60*1000,limit:10,standardHeaders:'draft-8',legacyHeaders:false,message:{error:'You have reached the limit of 10 AI requests per hour. Please try again later.'}});
  const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:5*1024*1024,files:1,fields:5,fieldSize:50000,parts:6}}).single('resume');
  const parser=new ResumeParserService();
  app.use('/api/v1/interview',limiter);
  for(const [route,full] of [['analyze',false],['full-report',true]] as const) {
    app.post(`/api/v1/interview/${route}`,upload,async(req,res,next)=>{
      const start=Date.now();
      try {
        if(full && options.premium) {
          const supplied=typeof req.body?.accessCode==='string'?req.body.accessCode:'';
          const hash=(value:string)=>createHash('sha256').update(value).digest();
          if(!options.accessCode || !timingSafeEqual(hash(supplied),hash(options.accessCode))) throw new ApiError(402,'A verified premium access code is required. Visit the upgrade page to continue.');
        }
        const input=inputSchema.parse(req.body);
        const resume=await parser.parse(req.file);
        const result=full?await ai.fullReport(input,resume):await ai.analyze(input,resume);
        res.json({...result,analysisId:randomUUID()});
      } catch(error){next(error);} finally {
        console.info(JSON.stringify({requestId:res.locals.requestId,fileType:req.file?.mimetype,fileSize:req.file?.size,processingMs:Date.now()-start}));
        if(req.file) req.file.buffer.fill(0);
      }
    });
  }
  app.use((_req,res)=>res.status(404).json({error:'Endpoint not found.'}));
  app.use((error:unknown,_req:express.Request,res:express.Response,_next:express.NextFunction)=>{
    if(error instanceof ZodError) {res.status(400).json({error:error.issues[0]?.message || 'Please check your inputs.'});return;}
    if(error instanceof multer.MulterError) {res.status(error.code==='LIMIT_FILE_SIZE'?413:400).json({error:error.code==='LIMIT_FILE_SIZE'?'Resume must be 5 MB or smaller.':'Invalid upload. Use one PDF or TXT file and the required form fields.'});return;}
    res.status(error instanceof ApiError?error.status:500).json({error:error instanceof ApiError?error.message:'Something went wrong. Please try again.',requestId:res.locals.requestId});
  });
  return app;
}
