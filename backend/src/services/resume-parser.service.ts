import { PDFParse } from 'pdf-parse';
import { ApiError } from '../errors.js';
export class ResumeParserService {
  async parse(file:Express.Multer.File | undefined):Promise<string> {
    if(!file) throw new ApiError(400,'Please upload your resume.');
    if(!file.size) throw new ApiError(400,'The resume is empty. Please choose another file.');
    if(file.size>5*1024*1024) throw new ApiError(413,'Resume must be 5 MB or smaller.');
    const name=file.originalname.replace(/[^a-zA-Z0-9.\-_]/g,'_').toLowerCase();
    let content:string;
    if(name.endsWith('.txt') && ['text/plain','application/octet-stream'].includes(file.mimetype)) {
      if(file.buffer.includes(0)) throw new ApiError(400,'Unable to read this text file. Upload a UTF-8 TXT resume.');
      try {content=new TextDecoder('utf-8',{fatal:true}).decode(file.buffer);} catch {throw new ApiError(400,'Upload a UTF-8 TXT resume.');}
    } else if(name.endsWith('.pdf') && file.mimetype==='application/pdf' && file.buffer.subarray(0,5).toString()==='%PDF-') {
      const parser=new PDFParse({data:new Uint8Array(file.buffer)});
      try {const result=await parser.getText(); content=result.text;} catch {throw new ApiError(400,'Unable to read the uploaded resume. Please upload an unencrypted, text-based PDF.');} finally {await parser.destroy();}
    } else throw new ApiError(400,'Please upload a valid PDF or TXT resume.');
    content=content.replace(/\s+/g,' ').trim();
    if(content.length<50) throw new ApiError(400,'Not enough readable text. Please upload a text-based PDF or TXT resume with at least 50 characters.');
    if(content.length>20000) throw new ApiError(400,'Resume text must be at most 20,000 characters.');
    return content;
  }
}
