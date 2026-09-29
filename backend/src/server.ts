import { createApp } from './app.js';
import { config } from './config.js';
createApp().listen(config.port,()=>console.info(`InterviewPrep API ready at http://localhost:${config.port}`));
