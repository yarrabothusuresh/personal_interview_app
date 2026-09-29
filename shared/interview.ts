import { z } from 'zod';

export const experiences = ['0–2 years', '3–5 years', '6–9 years', '10–15 years', '15+ years'] as const;
export const inputSchema = z.object({
  jobDescription: z.string().trim().min(100, 'Please provide the complete job description (at least 100 characters).').max(12000, 'Job description must be at most 12,000 characters.'),
  targetRole: z.string().trim().min(2, 'Enter your target role.').max(120),
  experience: z.enum(experiences, { error: 'Select your experience level.' }),
});
const text = z.string().min(1).max(12000);
export const questionSchema = z.object({question:text, category:text, difficulty:text, relevance:text, answer:text, simpleExplanation:text, practicalExample:text, commonMistakes:z.array(text).max(8), followUpQuestions:z.array(text).max(8)});
export const analysisSchema = z.object({
  candidateSummary:text, matchScore:z.number().int().min(0).max(100), matchExplanation:text,
  strongSkills:z.array(text).max(20), missingSkills:z.array(text).max(20),
  priorityTopics:z.array(text).length(5),
  sampleQuestions:z.array(z.object({question:text, shortAnswer:text, difficulty:text, category:text})).length(5),
});
export const questionSections = [
  ['resumeBasedQuestions','Resume'], ['javaQuestions','Java'], ['springBootQuestions','Spring Boot'],
  ['microservicesQuestions','Microservices'], ['kafkaQuestions','Kafka'], ['systemDesignQuestions','System Design'],
  ['aiQuestions','AI'], ['behavioralQuestions','Behavioral'],
] as const;
export const reportSchema = analysisSchema.extend({
  resumeBasedQuestions:z.array(questionSchema).length(10), javaQuestions:z.array(questionSchema).max(10),
  springBootQuestions:z.array(questionSchema).max(10), microservicesQuestions:z.array(questionSchema).max(5),
  kafkaQuestions:z.array(questionSchema).max(5), systemDesignQuestions:z.array(questionSchema).length(5),
  aiQuestions:z.array(questionSchema).min(2).max(5), behavioralQuestions:z.array(questionSchema).length(5),
  mostLikelyQuestions:z.array(z.string().min(1)).length(10),
  studyPlan:z.array(z.object({day:z.number().int().min(1).max(7),title:text,tasks:z.array(text).min(1).max(8)})).length(7),
}).superRefine((report, context) => {
  const questions = questionSections.flatMap(([key]) => report[key].map(q => q.question.trim().toLowerCase()));
  if(new Set(questions).size !== questions.length) context.addIssue({code:'custom',message:'Questions must be unique.'});
  if(new Set(report.studyPlan.map(d=>d.day)).size !== 7) context.addIssue({code:'custom',message:'Study plan must cover seven distinct days.'});
  const priorities = report.mostLikelyQuestions.map(q => q.trim().toLowerCase());
  if(new Set(priorities).size !== 10 || priorities.some(q=>!questions.includes(q))) context.addIssue({code:'custom',message:'Priority questions must reference ten distinct report questions.'});
});
export type InterviewInput = z.infer<typeof inputSchema>;
export type Analysis = z.infer<typeof analysisSchema> & {analysisId?:string};
export type Report = z.infer<typeof reportSchema>;
export type Question = z.infer<typeof questionSchema>;
export type Submission = InterviewInput & {resume:File};
