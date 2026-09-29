// @vitest-environment jsdom
import { afterEach,describe,it,expect,vi } from 'vitest';
import { render,screen,cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import { ResumeForm } from './ResumeForm';
import { AnalysisSummary } from './AnalysisSummary';
import { ErrorMessage } from './Feedback';
import { Questions } from './Questions';
import { sampleAnalysis,sampleReport } from '../data/sample';
afterEach(cleanup);
describe('core user experience',()=>{
 it('shows required-field errors before submission',async()=>{const onSubmit=vi.fn();render(<MemoryRouter><ResumeForm onSubmit={onSubmit} error=""/></MemoryRouter>);await userEvent.click(screen.getByRole('button',{name:'Generate Free Analysis'}));expect(await screen.findByText('Please upload your resume.')).toBeVisible();expect(screen.getByText(/at least 100 characters/)).toBeVisible();expect(onSubmit).not.toHaveBeenCalled();});
 it('rejects unsupported upload and accepts a TXT file',async()=>{render(<MemoryRouter><ResumeForm onSubmit={vi.fn()} error=""/></MemoryRouter>);const input=screen.getByLabelText('Upload your resume');await userEvent.upload(input,new File(['resume'], 'resume.txt',{type:'text/plain'}));expect(screen.getByText('resume.txt')).toBeVisible();await userEvent.click(screen.getByRole('button',{name:'Remove resume'}));expect(screen.getByText('Drop your resume here')).toBeVisible();});
 it('renders score, strengths, gaps and estimate qualification',()=>{render(<AnalysisSummary analysis={sampleAnalysis}/>);expect(screen.getByText('Kubernetes')).toBeVisible();expect(screen.getByText('Java')).toBeVisible();expect(screen.getByText(/not a hiring probability/)).toBeVisible();});
 it('renders accessible server errors',()=>{render(<ErrorMessage message="AI service is temporarily unavailable."/>);expect(screen.getByRole('alert')).toHaveTextContent('temporarily unavailable');});
 it('filters and searches questions and clears empty results',async()=>{render(<Questions report={sampleReport}/>);await userEvent.click(screen.getByRole('button',{name:'Kafka'}));expect(screen.getByText(/2 questions/)).toBeVisible();await userEvent.type(screen.getByRole('textbox',{name:'Search interview questions'}),'consumer lag');expect(screen.getByText(/1 questions/)).toBeVisible();await userEvent.clear(screen.getByRole('textbox',{name:'Search interview questions'}));await userEvent.type(screen.getByRole('textbox',{name:'Search interview questions'}),'no-such-question');expect(screen.getByText('No questions found')).toBeVisible();await userEvent.click(screen.getByRole('button',{name:'Clear filters'}));expect(screen.getByText(/12 questions/)).toBeVisible();});
});

