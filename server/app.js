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
app.set('src', './public');
app.use(express.static('src'));

app.use('/', indexRouter);
app.use('/googleapis', googleApisRouter);
app.use('/replay', replayRouter);

export default app;
