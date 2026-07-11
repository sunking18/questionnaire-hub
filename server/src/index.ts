import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { authRouter } from './routes/auth';
import { questionnaireRouter } from './routes/questionnaires';
import { scaleRouter } from './routes/scales';
import { responseRouter } from './routes/responses';
import { reportRouter } from './routes/reports';
import { distributionRouter } from './routes/distributions';
import { statisticsRouter } from './routes/statistics';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/questionnaires', questionnaireRouter);
app.use('/api/scales', scaleRouter);
app.use('/api/responses', responseRouter);
app.use('/api/reports', reportRouter);
app.use('/api/distributions', distributionRouter);
app.use('/api/statistics', statisticsRouter);

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 API: http://localhost:${PORT}/api/health`);
});

export default app;
