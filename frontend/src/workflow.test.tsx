// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom/vitest';
import App from './App';
import { generate, getConfig } from './services/api';
import { downloadReport } from './utils/pdfGenerator';
import { sampleAnalysis, sampleReport } from './data/sample';

vi.mock('./services/api',()=>({generate:vi.fn(),getConfig:vi.fn()}));
vi.mock('./utils/pdfGenerator',()=>({downloadReport:vi.fn().mockResolvedValue(undefined)}));
beforeEach(()=>{
  vi.clearAllMocks();
  vi.spyOn(window,'scrollTo').mockImplementation(()=>{});
  Element.prototype.scrollIntoView=vi.fn();
  vi.mocked(getConfig).mockResolvedValue({aiConfigured:true,premiumMode:false,paymentLink:''});
});
afterEach(()=>{cleanup();vi.restoreAllMocks();});
async function analyze(){
  const user=userEvent.setup();
  await user.upload(screen.getByLabelText('Upload your resume'),new File(['Synthetic senior Java developer resume with Spring Boot and Kafka experience.'],'resume.txt',{type:'text/plain'}));
  await user.type(screen.getByLabelText('Job description'),'Senior Java developer required with Spring Boot, microservices, Kafka, cloud architecture, and experience building reliable enterprise systems.');
  await user.type(screen.getByLabelText('Target role'),'Senior Java Developer');
  await user.selectOptions(screen.getByLabelText('Experience'),'10–15 years');
  await user.click(screen.getByRole('button',{name:'Generate Free Analysis'}));
  await screen.findByRole('heading',{name:'A clearer path to your next role.'});
  return user;
}
describe('complete user journeys',()=>{
  it('analyzes, generates a free pack, downloads, and preserves results during navigation',async()=>{
    vi.mocked(generate).mockResolvedValueOnce(sampleAnalysis).mockResolvedValueOnce(sampleReport);
    render(<MemoryRouter><App/></MemoryRouter>);
    const user=await analyze();
    await user.click(screen.getByRole('link',{name:'Unlock Complete Interview Pack'}));
    await user.click(screen.getByRole('button',{name:/Generate Full Interview Pack/}));
    await screen.findByRole('heading',{name:'Your interview preparation pack.'});
    await user.click(screen.getByRole('button',{name:'Download Interview Pack'}));
    expect(downloadReport).toHaveBeenCalledWith(sampleReport,'Senior Java Developer','10–15 years',false);
    await user.click(screen.getByRole('link',{name:'Features'}));
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    await user.click(screen.getByRole('link',{name:'Pricing'}));
    await user.click(screen.getByRole('link',{name:'Back to your analysis'}));
    expect(screen.getByRole('heading',{name:'A clearer path to your next role.'})).toBeVisible();
    expect(generate).toHaveBeenCalledTimes(2);
  });
  it('recovers configuration without refresh and submits a premium access code',async()=>{
    vi.mocked(getConfig).mockRejectedValueOnce(new Error('offline')).mockResolvedValue({aiConfigured:true,premiumMode:true,paymentLink:'https://example.com/pay'});
    vi.mocked(generate).mockResolvedValueOnce(sampleAnalysis).mockRejectedValueOnce(new Error('A verified premium access code is required.')).mockResolvedValueOnce(sampleReport);
    render(<MemoryRouter><App/></MemoryRouter>);
    const user=await analyze();
    await user.click(screen.getByRole('link',{name:'Unlock Complete Interview Pack'}));
    await user.click(screen.getByRole('button',{name:'Retry connection'}));
    await user.type(await screen.findByLabelText('Already paid? Enter your access code'),'wrong-code');
    await user.click(screen.getByRole('button',{name:'Generate my interview pack'}));
    expect(await screen.findByRole('alert')).toHaveTextContent('verified premium access code');
    await user.clear(screen.getByLabelText('Already paid? Enter your access code'));
    await user.type(screen.getByLabelText('Already paid? Enter your access code'),'valid-code');
    await user.click(screen.getByRole('button',{name:'Generate my interview pack'}));
    await screen.findByRole('heading',{name:'Your interview preparation pack.'});
    expect(generate).toHaveBeenLastCalledWith(expect.objectContaining({targetRole:'Senior Java Developer'}),true,'valid-code');
  });
  it('redirects a direct report visit without session data to the form',()=>{
    render(<MemoryRouter initialEntries={['/report']}><App/></MemoryRouter>);
    expect(screen.getByRole('button',{name:'Generate Free Analysis'})).toBeVisible();
  });
  it('opens the sample without calling AI',()=>{
    render(<MemoryRouter initialEntries={['/sample']}><App/></MemoryRouter>);
    expect(screen.getByText('Sample report')).toBeVisible();
    expect(generate).not.toHaveBeenCalled();
  });
});
