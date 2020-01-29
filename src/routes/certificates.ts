import Busboy from 'busboy';
import { Router } from 'express';
import { pki } from 'node-forge';

import {
  getCACertificate,
  signClientRequest, signServerRequest
} from 'easyrsa';

import auth from 'middlewares/auth';
import { HttpError } from 'middlewares/errors';

// Types
interface SignBody {
  type?: string,
  csr?: pki.Certificate
}

// Router
export default function(app: Router) {
  // ca certificate
  app.get('/certificates/ca.crt', (req, res) => {
    const cert = getCACertificate();
    const pem = pki.certificateToPem(cert);

    res.set('Content-Type', 'application/x-x509-ca-cert');
    res.send(pem);
  });

  // sign certificate
  app.post('/certificates/sign', auth, (req, res) => {
    // Parse values
    const busboy = new Busboy({ headers: req.headers });
    const body: SignBody = {};

    // - files
    busboy.on('file', (fieldname, file) => {
      if (fieldname !== 'csr') return;
      let pem = '';

      file.on('data', (data: Buffer) => {
        pem = pem.concat(data.toString());
      });

      file.on('end', () => {
        // Parse data
        body.csr = pki.certificationRequestFromPem(pem);
      });
    });

    // - fields
    busboy.on('field', (fieldname, val) => {
      if (fieldname === 'type') body.type = val;
    });

    busboy.on('finish', () => {
      // Check all parameters
      const missing = [];
      if (!body.type) missing.push('type');
      if (!body.csr)  missing.push('csr');

      if (missing.length > 0) {
        throw HttpError.BadRequest(`Missing required parameters: ${missing.join(', ')}`);
      }

      // Sign certificate
      switch (body.type!) {
        case 'client': {
          const cert = signClientRequest(body.csr!);

          res.set('Content-Type', 'application/x-x509-user-cert');
          return res.send(pki.certificateToPem(cert));
        }

        case 'server': {
          const cert = signServerRequest(body.csr!);

          res.set('Content-Type', 'application/x-x509-user-cert');
          return res.send(pki.certificateToPem(cert));
        }

        default:
          throw HttpError.BadRequest('Invalid value for type');
      }
    });

    req.pipe(busboy);
  });
}