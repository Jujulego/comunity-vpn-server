import { promises as fs } from 'fs';
import { pki } from 'node-forge';

import easyrsa from 'easyrsa';

// CA config
const CA_CONFIG = {
  commonName: 'Community VPN',
  organizationalUnitName: 'communityvpn.server',
  organizationName: 'Community VPN',
  localityName: 'Paris',
  stateOrProvinceName: 'Ile-de-France',
  countryName: 'France'
};

// Tests
describe("easyrsa", () => {
  beforeAll(async () => {
    if (!await easyrsa.hasCA()) {
      await easyrsa.buildCA(CA_CONFIG);
    } else {
      await easyrsa.loadCA();
    }
  });

  test('Generate request', async () => {
    // Generate cert
    const crs = easyrsa.generateReq({
      ...CA_CONFIG,
      unstructuredName: 'test'
    });

    // Save it to file
    const req = pki.certificationRequestToPem(crs);
    await fs.writeFile('base.req', req);

    // Sign as server
    const srv = easyrsa.signServerReq(req.toString());
    await fs.writeFile('server.crt', pki.certificateToPem(srv));

    // Sign as client
    const clt = easyrsa.signClientReq(req.toString());
    await fs.writeFile('client.crt', pki.certificateToPem(clt));
  });
});