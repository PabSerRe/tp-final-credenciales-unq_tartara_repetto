'use client';

import { useMemo, useState } from 'react';
import { BrowserProvider, Contract, JsonRpcProvider, id, isAddress } from 'ethers';
import {
  CREDENTIALS_ADDRESS,
  CREDENTIALS_ABI,
  BASE_SEPOLIA_TX_URL,
} from '../contracts/credentials';

declare global {
  interface Window {
    ethereum?: any;
  }
}

const BASE_SEPOLIA_RPC_URL = 'https://sepolia.base.org';

export default function Home() {
  const [account, setAccount] = useState('');
  const [isIssuer, setIsIssuer] = useState(false);

  const [verifyTokenId, setVerifyTokenId] = useState('');
  const [verifyResult, setVerifyResult] = useState<any>(null);

  const [studentAddress, setStudentAddress] = useState('');
  const [issueTokenId, setIssueTokenId] = useState('');
  const [metadataURI, setMetadataURI] = useState('');
  const [degreeName, setDegreeName] = useState('');
  const [studentName, setStudentName] = useState('');
  const [documentText, setDocumentText] = useState('');

  const [revokeTokenId, setRevokeTokenId] = useState('');

  const [status, setStatus] = useState('');
  const [txHash, setTxHash] = useState('');

  const readContract = useMemo(() => {
    const provider = new JsonRpcProvider(BASE_SEPOLIA_RPC_URL);
    return new Contract(CREDENTIALS_ADDRESS, CREDENTIALS_ABI, provider);
  }, []);

  async function getWriteContract() {
    if (!window.ethereum) {
      throw new Error('No se detectó MetaMask.');
    }

    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    return new Contract(CREDENTIALS_ADDRESS, CREDENTIALS_ABI, signer);
  }

  async function connectWallet() {
    setStatus('');
    setTxHash('');

    if (!window.ethereum) {
      setStatus('No se detectó MetaMask.');
      return;
    }

    const provider = new BrowserProvider(window.ethereum);
    const accounts = await provider.send('eth_requestAccounts', []);
    const connectedAccount = accounts[0];

    setAccount(connectedAccount);

    const issuerRole = await readContract.ISSUER_ROLE();
    const hasIssuerRole = await readContract.hasRole(issuerRole, connectedAccount);

    setIsIssuer(Boolean(hasIssuerRole));
  }

  async function verifyCredential(e: React.FormEvent) {
    e.preventDefault();
    setStatus('');
    setTxHash('');
    setVerifyResult(null);

    if (!verifyTokenId) return;

    try {
      const result = await readContract.verify(BigInt(verifyTokenId));
      const credential = result[0];
      const valid = result[1];
      let tokenURI = 'No disponible';
      let owner = 'No disponible';

      try {
        tokenURI = await readContract.tokenURI(BigInt(verifyTokenId));
      } catch {}

      try {
        owner = await readContract.ownerOf(BigInt(verifyTokenId));
      } catch {}

      setVerifyResult({
        owner,
        tokenURI,
        degreeName: credential.degreeName,
        studentNameHash: credential.studentNameHash,
        documentHash: credential.documentHash,
        issueDate: new Date(Number(credential.issueDate) * 1000).toLocaleString(),
        active: credential.active,
        valid,
      });
    } catch (err: any) {
      setStatus(`Error al verificar: ${err.message}`);
    }
  }

  async function issueCredential(e: React.FormEvent) {
    e.preventDefault();
    setStatus('');
    setTxHash('');

    if (!isAddress(studentAddress)) {
      setStatus('La dirección del estudiante no es válida.');
      return;
    }

    try {
      const contract = await getWriteContract();

      const studentNameHash = id(studentName);
      const documentHash = id(documentText);

      const tx = await contract.issueCredential(
        studentAddress,
        BigInt(issueTokenId),
        metadataURI,
        degreeName,
        studentNameHash,
        documentHash
      );

      setTxHash(tx.hash);
      setStatus('Transacción enviada. Esperando confirmación...');

      await tx.wait();

      setStatus('Credencial emitida correctamente.');
    } catch (err: any) {
      setStatus(`Error al emitir: ${err.message}`);
    }
  }

  async function revokeCredential(e: React.FormEvent) {
    e.preventDefault();
    setStatus('');
    setTxHash('');

    try {
      const contract = await getWriteContract();

      const tx = await contract.revoke(BigInt(revokeTokenId));

      setTxHash(tx.hash);
      setStatus('Transacción enviada. Esperando confirmación...');

      await tx.wait();

      setStatus('Credencial revocada correctamente.');
    } catch (err: any) {
      setStatus(`Error al revocar: ${err.message}`);
    }
  }

  return (
    <main style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      <h1>UNQ — Credenciales académicas</h1>

      <p>Sistema de emisión y verificación de credenciales académicas sobre Base Sepolia.</p>

      <p style={{ fontSize: '0.85rem', wordBreak: 'break-all' }}>
        Contrato: {CREDENTIALS_ADDRESS}
      </p>

      <button onClick={connectWallet} style={{ padding: '0.6rem 1rem', marginBottom: '1rem' }}>
        {account ? 'Wallet conectada' : 'Conectar wallet'}
      </button>

      {account && (
        <p style={{ fontSize: '0.9rem', wordBreak: 'break-all' }}>
          Wallet: {account}<br />
          Rol issuer: {isIssuer ? 'sí' : 'no'}
        </p>
      )}

      <section style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '1rem', marginTop: '1rem' }}>
        <h2>Verificar credencial</h2>

        <form onSubmit={verifyCredential}>
          <input
            value={verifyTokenId}
            onChange={(e) => setVerifyTokenId(e.target.value)}
            placeholder="Token ID"
            style={{ width: '100%', padding: '0.5rem', marginBottom: '0.75rem' }}
          />

          <button type="submit" style={{ padding: '0.5rem 1rem' }}>
            Verificar
          </button>
        </form>

        {verifyResult && (
          <div style={{ marginTop: '1rem', lineHeight: 1.6 }}>
            <strong>Resultado:</strong><br />
            Válida: {verifyResult.valid ? 'sí' : 'no'}<br />
            Activa: {verifyResult.active ? 'sí' : 'no'}<br />
            Título / curso: {verifyResult.degreeName}<br />
            Fecha de emisión: {verifyResult.issueDate}<br />
            Owner: {verifyResult.owner}<br />
            Token URI: {verifyResult.tokenURI}<br />
            Hash estudiante: {verifyResult.studentNameHash}<br />
            Hash documento: {verifyResult.documentHash}
          </div>
        )}
      </section>

      {isIssuer && (
        <>
          <section style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '1rem', marginTop: '1rem' }}>
            <h2>Emitir credencial</h2>

            <form onSubmit={issueCredential}>
              <input value={studentAddress} onChange={(e) => setStudentAddress(e.target.value)} placeholder="Wallet del estudiante" style={{ width: '100%', padding: '0.5rem', marginBottom: '0.75rem' }} />
              <input value={issueTokenId} onChange={(e) => setIssueTokenId(e.target.value)} placeholder="Token ID" style={{ width: '100%', padding: '0.5rem', marginBottom: '0.75rem' }} />
              <input value={metadataURI} onChange={(e) => setMetadataURI(e.target.value)} placeholder="Metadata URI" style={{ width: '100%', padding: '0.5rem', marginBottom: '0.75rem' }} />
              <input value={degreeName} onChange={(e) => setDegreeName(e.target.value)} placeholder="Título / curso" style={{ width: '100%', padding: '0.5rem', marginBottom: '0.75rem' }} />
              <input value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="Nombre del estudiante para hash" style={{ width: '100%', padding: '0.5rem', marginBottom: '0.75rem' }} />
              <input value={documentText} onChange={(e) => setDocumentText(e.target.value)} placeholder="Texto/documento para hash" style={{ width: '100%', padding: '0.5rem', marginBottom: '0.75rem' }} />

              <button type="submit" style={{ padding: '0.5rem 1rem' }}>
                Emitir
              </button>
            </form>
          </section>

          <section style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '1rem', marginTop: '1rem' }}>
            <h2>Revocar credencial</h2>

            <form onSubmit={revokeCredential}>
              <input value={revokeTokenId} onChange={(e) => setRevokeTokenId(e.target.value)} placeholder="Token ID" style={{ width: '100%', padding: '0.5rem', marginBottom: '0.75rem' }} />

              <button type="submit" style={{ padding: '0.5rem 1rem' }}>
                Revocar
              </button>
            </form>
          </section>
        </>
      )}

      {status && <p style={{ marginTop: '1rem' }}>{status}</p>}

      {txHash && (
        <p style={{ wordBreak: 'break-all' }}>
          Tx:{' '}
          <a href={`${BASE_SEPOLIA_TX_URL}/${txHash}`} target="_blank" rel="noopener noreferrer">
            {txHash}
          </a>
        </p>
      )}
    </main>
  );
}
