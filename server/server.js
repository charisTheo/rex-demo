import express from 'express';
import cookieParser from 'cookie-parser';
import logger from 'morgan';

import indexRouter from './routes/index.js';
import googleApisRouter from './routes/googleapis.js';
import replayRouter from './routes/replay.js';

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());

app.set('view engine', 'html');
app.set('src', './../front-end/dist');
app.use(express.static('src'));
app.set('traces', './traces');
app.use('/trace', express.static('traces'));

app.use('/api', indexRouter);
app.use('/api/googleapis', googleApisRouter);
app.use('/api/replay', replayRouter);

export default app;
