import { DataSource } from 'typeorm';
import config from './src/config';

export default new DataSource(config().database as any);
