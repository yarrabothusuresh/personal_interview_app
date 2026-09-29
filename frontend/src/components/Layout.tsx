import { Link, useLocation } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useEffect } from 'react';
export function Layout({children}:{children:React.ReactNode}) {
  const {pathname,hash}=useLocation();
  useEffect(()=>{
    if(hash) document.getElementById(hash.slice(1))?.scrollIntoView();
    else window.scrollTo(0,0);
  },[pathname,hash]);
  return <><a className="skip-link" href="#main">Skip to content</a><header className="site-header"><div className="header-inner"><Link to="/" className="brand"><Sparkles aria-hidden="true"/><span>InterviewPrep <strong>AI</strong></span></Link><nav aria-label="Main navigation"><Link to="/#how-it-works">How It Works</Link><Link to="/#features">Features</Link><Link to="/pricing">Pricing</Link></nav></div></header><main id="main">{children}</main><footer><div className="footer-inner"><Link to="/" className="brand"><Sparkles aria-hidden="true"/><span>InterviewPrep AI</span></Link><span>Built for your next chapter.</span><Link to="/privacy">Privacy notice <ArrowRight size={13}/></Link></div></footer></>;
}
export function Stepper({step=1}:{step?:number}) {return <ol className="stepper" aria-label="Preparation progress">{['Your details','Skill-gap analysis','Interview pack'].map((label,i)=><li key={label} className={step===i+1?'active':step>i+1?'complete':''} aria-current={step===i+1?'step':undefined}><span>{i+1}</span>{label}</li>)}</ol>;}
