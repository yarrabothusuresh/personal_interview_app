import { useEffect, useState } from 'react';
import { AlertCircle, LoaderCircle, Sparkles } from 'lucide-react';
export function ErrorMessage({message}:{message:string}){return <div className="error-message" role="alert"><AlertCircle size={19}/><span>{message}</span></div>;}
const messages=['Reading your resume…','Comparing skills with the job description…','Identifying skill gaps…','Preparing interview questions…','Creating your study plan…'];
export function LoadingState({full=false}:{full?:boolean}){
  const [index,setIndex]=useState(0);
  useEffect(()=>{const timer=setInterval(()=>setIndex(i=>(i+1)%messages.length),4000);return()=>clearInterval(timer);},[]);
  return <div className="loading-state" role="status" aria-live="polite"><span className="icon-bubble"><Sparkles/></span><h2>{full?'Building your interview pack':'Connecting the dots'}</h2><p>{messages[index]}</p><LoaderCircle className="spin"/><small>{full?'A detailed pack can take up to two minutes.':'This may take a moment. Keep this page open.'}</small></div>;
}
