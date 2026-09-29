import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, ArrowLeft, CalendarDays, Star } from 'lucide-react';
import type { Report } from '../../../shared/interview';
import { Stepper } from '../components/Layout';
import { AnalysisSummary } from '../components/AnalysisSummary';
import { Questions } from '../components/Questions';
import { ErrorMessage } from '../components/Feedback';
import { downloadReport } from '../utils/pdfGenerator';
export function PremiumReportPage({report,role,experience,sample=false}:{report:Report;role:string;experience:string;sample?:boolean}){
 const [downloading,setDownloading]=useState(false);const [error,setError]=useState('');
 async function download(){setDownloading(true);setError('');try{await downloadReport(report,role,experience,sample);}catch{setError('Unable to create the PDF. Please try again.');}finally{setDownloading(false);}}
 return <div className="container result-page"><Link to={sample?'/':'/analysis'} className="back-link"><ArrowLeft size={16}/>{sample?'Create your own analysis':'Back to your analysis'}</Link><Stepper step={3}/>{sample&&<div className="sample-notice"><strong>Sample report</strong><span>A curated preview for a Java engineer. This is illustrative content, not an analysis of your resume. The full generated pack is more extensive.</span></div>}<div className="report-heading"><div className="page-heading"><span className="eyebrow">PREPARED FOR YOUR NEXT CHAPTER</span><h1>Your interview preparation pack.</h1><p>{role} <span>·</span> {experience}</p></div><button onClick={()=>void download()} className="button primary" disabled={downloading}><Download size={18}/>{downloading?'Preparing PDF…':'Download Interview Pack'}</button></div>{error&&<ErrorMessage message={error}/>}<AnalysisSummary analysis={report}/><section className="panel priority-questions"><h3><Star size={20}/> Prepare these first</h3><p className="muted">Your ten highest-priority questions, in one place.</p><ol>{report.mostLikelyQuestions.map(q=><li key={q}>{q}</li>)}</ol></section><Questions report={report}/><section className="study-section"><div className="section-heading"><div><span className="eyebrow">A LITTLE PROGRESS, EVERY DAY</span><h2><CalendarDays size={25}/> Your 7-day preparation plan</h2></div></div><div className="study-list">{report.studyPlan.map(day=><article key={day.day}><span className="day-label">DAY {day.day}</span><div><h3>{day.title}</h3><ul>{day.tasks.map(task=><li key={task}>{task}</li>)}</ul></div></article>)}</div></section>{sample&&<div className="bottom-cta"><h2>Now make it personal.</h2><Link className="button primary" to="/">Start Free Analysis</Link></div>}</div>;
}
