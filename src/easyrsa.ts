import crypto from 'crypto';
import { promises as fs } from 'fs';
import moment from 'moment';
import { pki, md } from 'node-forge';
import path from 'path';

// Type
export interface CA {
  key: pki.PrivateKey,
  cert: pki.Certificate
}

type AttributesNames =
  'countryName' | 'stateOrProvinceName' | 'localityName' |
  'commonName' | 'organizationName' | 'organizationalUnitName';

export type CAAttributes = { [name in AttributesNames]: string };

// Config
const config = {
  dir: './pki',
  dmode: 0o700, // Directory mode
  fmode: 0o600, // File mode

  days: 3650,
  keySize: 2048,
  serialNumberSize: 9
};

// Globals
let ca: CA | null = null;

// Utils
function buildSubject(attrs: CAAttributes): pki.CertificateField[] {
  return Object.keys(attrs)
    .reduce<pki.CertificateField[]>((subject, name) => {
      subject.push({ name, value: attrs[name as AttributesNames] });
      return subject;
    }, []);
}

// Functions
export async function hasPKI() {
  try {
    const dir = await fs.stat(config.dir);
    return dir.isDirectory();
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

export async function hasCA() {
  if (!await hasPKI()) return false;

  try {
    const key  = await fs.stat(path.join(config.dir, 'ca.key'));
    const cert = await fs.stat(path.join(config.dir, 'ca.crt'));

    return key.isFile() && cert.isFile();
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

export async function initPKI() {
  console.log('Init PKI ...');

  await fs.mkdir(config.dir, { mode: config.dmode });
}

export async function loadCA() {
  console.log('Load CA ...');

  // Load files
  const key  = await fs.readFile(path.join(config.dir, 'ca.key'));
  const cert = await fs.readFile(path.join(config.dir, 'ca.crt'));

  ca = {
    key:  await pki.privateKeyFromPem(key.toString()),
    cert: await pki.certificateFromPem(cert.toString())
  }
}

export async function buildCA(attrs: CAAttributes) {
  // Init PKI first
  if (!await hasPKI()) await initPKI();

  console.log('Build CA ...');

  // Generate key pair
  const keypair = pki.rsa.generateKeyPair({ bits: config.keySize, e: 0x10001, workers: -1 });

  // Generate certificate
  const cert = pki.createCertificate();
  cert.publicKey = keypair.publicKey;
  cert.serialNumber = crypto.randomBytes(config.serialNumberSize).toString('hex');

  const now = moment().utc();
  cert.validity.notBefore = now.toDate();
  cert.validity.notAfter = now.add(config.days, 'days').toDate();

  const subject = buildSubject(attrs);
  cert.setSubject(subject);
  cert.setIssuer(subject);

  cert.setExtensions([{
    name: 'subjectKeyIdentifier'
  }, {
    name: 'authorityKeyIdentifier',
    keyIdentifier: true,
    authorityCertIssuer: true,
    serialNumber: true
  }, {
    name: 'basicConstraints',
    cA: true
  }, {
    name: 'keyUsage',
    keyCertSign: true,
    cRLSign: true
  }]);

  // Sign certificate
  cert.sign(keypair.privateKey, md.sha256.create());

  // Save certificate
  await fs.writeFile(path.join(config.dir, 'ca.key'), pki.privateKeyToPem(keypair.privateKey), { mode: config.fmode });
  await fs.writeFile(path.join(config.dir, 'ca.crt'), pki.certificateToPem(cert), { mode: config.fmode });

  ca = { key: keypair.privateKey, cert };
  return ca;
}

export default {
  hasPKI, initPKI,
  hasCA, loadCA, buildCA
}