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
    const { csr } = easyrsa.generateRequest({
      ...CA_CONFIG,
      unstructuredName: 'test'
    });

    // Save it to file
    await fs.writeFile('base.req', pki.certificationRequestToPem(csr));

    // Sign as server
    const srv = easyrsa.signServerRequest(csr);
    await fs.writeFile('server.crt', pki.certificateToPem(srv));

    // Sign as client
    const clt = easyrsa.signClientRequest(csr);
    await fs.writeFile('client.crt', pki.certificateToPem(clt));
  });
});