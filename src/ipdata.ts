import IPData from 'ipdata';

import { env } from './env';

// Setup ipdata service
const ipdata = new IPData(env.IPDATA_KEY);

export default ipdata;