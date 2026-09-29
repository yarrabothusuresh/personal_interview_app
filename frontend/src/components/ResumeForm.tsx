import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Upload, FileText, LockKeyhole, ArrowRight, X } from 'lucide-react';
import { experiences, inputSchema, type InterviewInput, type Submission } from '../../../shared/interview';
import { ErrorMessage } from './Feedback';
export function ResumeForm({onSubmit,error,initial}:{onSubmit:(data:Submission)=>void;error:string;initial?:Submission}) {
  const {register,handleSubmit,watch,formState:{errors}}=useForm<InterviewInput>({resolver:zodResolver(inputSchema),defaultValues:initial});
  const [file,setFile]=useState<File|undefined>(initial?.resume);
  const [fileError,setFileError]=useState('');
  const [dragging,setDragging]=useState(false);
  const input=useRef<HTMLInputElement>(null);
  function selectFile(next:File|undefined){
    if(!next)return;
    if(!/\.(pdf|txt)$/i.test(next.name)){setFile(undefined);setFileError('Please choose a PDF or TXT resume.');return;}
    if(next.size===0 || next.size>5*1024*1024){setFile(undefined);setFileError('Choose a non-empty file, up to 5 MB.');return;}
    setFile(next);setFileError('');
  }
  const submit=handleSubmit(values=>{if(!file){setFileError('Please upload your resume.');return;}onSubmit({...values,resume:file});});
  return <form className="form-panel" onSubmit={e=>{if(!file)setFileError('Please upload your resume.');void submit(e);}} noValidate>
    <h2>Make your next interview your best.</h2><p className="muted form-intro">A little context. A preparation plan built around you.</p>
    <div className="form-grid"><div><label htmlFor="resume">Upload your resume</label><div className={`drop-zone ${dragging?'dragging':''} ${file?'has-file':''}`} onDragOver={e=>{e.preventDefault();setDragging(true);}} onDragLeave={()=>setDragging(false)} onDrop={e=>{e.preventDefault();setDragging(false);selectFile(e.dataTransfer.files[0]);}}>
      <span className="icon-bubble">{file?<FileText/>:<Upload/>}</span><strong className="file-name">{file?file.name:'Drop your resume here'}</strong><span className="muted small">{file?`${(file.size/1024).toFixed(1)} KB · Ready to analyze`:'PDF or TXT · Up to 5 MB'}</span><button type="button" className="button small-button secondary" onClick={()=>input.current?.click()}>{file?'Change file':'Choose file'}</button>{file&&<button className="remove-file" type="button" aria-label="Remove resume" onClick={()=>{setFile(undefined);if(input.current)input.current.value='';}}><X size={16}/></button>}<input className="visually-hidden" id="resume" ref={input} type="file" accept=".pdf,.txt" onChange={e=>selectFile(e.target.files?.[0])} aria-describedby={fileError?'resume-error':undefined}/></div>{fileError&&<p className="field-error" id="resume-error">{fileError}</p>}</div>
    <div><label htmlFor="jd">Job description</label><div className="textarea-wrap"><textarea id="jd" placeholder="Paste the complete job description here…" maxLength={12000} {...register('jobDescription')} aria-invalid={Boolean(errors.jobDescription)} aria-describedby={errors.jobDescription?'jd-error':undefined}/><span>{(watch('jobDescription')?.length || 0).toLocaleString()} / 12,000</span></div>{errors.jobDescription&&<p className="field-error" id="jd-error">{errors.jobDescription.message}</p>}</div>
    <div><label htmlFor="role">Target role</label><input id="role" placeholder="e.g. Senior Java Developer" maxLength={120} {...register('targetRole')} aria-invalid={Boolean(errors.targetRole)}/>{errors.targetRole&&<p className="field-error">{errors.targetRole.message}</p>}</div><div><label htmlFor="experience">Experience</label><select id="experience" {...register('experience')} aria-invalid={Boolean(errors.experience)}><option value="">Select experience</option>{experiences.map(value=><option key={value}>{value}</option>)}</select>{errors.experience&&<p className="field-error">{errors.experience.message}</p>}</div></div>
    {error&&<ErrorMessage message={error}/>}<button className="button primary full-width" type="submit">Generate Free Analysis <ArrowRight size={18}/></button><p className="privacy-line"><LockKeyhole size={14}/> Your resume is processed securely and never stored.</p><p className="provider-note">Resume text is sent to Google Gemini to generate your analysis. <Link to="/privacy">Privacy details</Link></p>
  </form>;
}
