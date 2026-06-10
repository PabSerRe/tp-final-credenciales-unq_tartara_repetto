'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { FormEvent, useEffect, useState } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import {
  Address,
  Hex,
  createPublicClient,
  http,
  isAddress,
  keccak256,
  stringToHex,
} from 'viem';
import { baseSepolia } from 'wagmi/chains';
import {
  CREDENTIALS_ADDRESS,
  CREDENTIALS_ABI,
  BASE_SEPOLIA_TX_URL,
  BASE_SEPOLIA_ADDRESS_URL,
} from '../contracts/credentials';

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http('https://sepolia.base.org'),
});

type VerifyResult = {
  owner: string;
  tokenURI: string;
  degreeName: string;
  studentNameHash: string;
  documentHash: string;
  issueDate: string;
  active: boolean;
  valid: boolean;
};

export default function Home() {
  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const [isIssuer, setIsIssuer] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [verifyTokenId, setVerifyTokenId] = useState('');
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);

  const [studentAddress, setStudentAddress] = useState('');
  const [issueTokenId, setIssueTokenId] = useState('');
  const [metadataURI, setMetadataURI] = useState('');
  const [degreeName, setDegreeName] = useState('');
  const [studentName, setStudentName] = useState('');
  const [documentText, setDocumentText] = useState('');

  const [revokeTokenId, setRevokeTokenId] = useState('');
  const [revokeReason, setRevokeReason] = useState('');

  const [issuerAddress, setIssuerAddress] = useState('');

  const [status, setStatus] = useState('');
  const [txHash, setTxHash] = useState('');

  async function refreshRoles(wallet?: Address) {
    if (!wallet) {
      setIsIssuer(false);
      setIsAdmin(false);
      return;
    }

    const issuerRole = await publicClient.readContract({
      address: CREDENTIALS_ADDRESS,
      abi: CREDENTIALS_ABI,
      functionName: 'ISSUER_ROLE',
    }) as Hex;

    const adminRole = await publicClient.readContract({
      address: CREDENTIALS_ADDRESS,
      abi: CREDENTIALS_ABI,
      functionName: 'DEFAULT_ADMIN_ROLE',
    }) as Hex;

    const hasIssuerRole = await publicClient.readContract({
      address: CREDENTIALS_ADDRESS,
      abi: CREDENTIALS_ABI,
      functionName: 'hasRole',
      args: [issuerRole, wallet],
    }) as boolean;

    const hasAdminRole = await publicClient.readContract({
      address: CREDENTIALS_ADDRESS,
      abi: CREDENTIALS_ABI,
      functionName: 'hasRole',
      args: [adminRole, wallet],
    }) as boolean;

    setIsIssuer(hasIssuerRole);
    setIsAdmin(hasAdminRole);
  }

  useEffect(() => {
    refreshRoles(address);
  }, [address]);

  async function waitForTx(hash: Hex, successMessage: string) {
    setTxHash(hash);
    setStatus('Transacción enviada. Esperando confirmación...');

    await publicClient.waitForTransactionReceipt({ hash });

    setStatus(successMessage);
    await refreshRoles(address);
  }

  async function verifyCredential(e: FormEvent) {
    e.preventDefault();
    setStatus('');
    setTxHash('');
    setVerifyResult(null);

    if (!verifyTokenId) {
      setStatus('Ingresá un tokenId.');
      return;
    }

    try {
      const [credential, valid] = await publicClient.readContract({
        address: CREDENTIALS_ADDRESS,
        abi: CREDENTIALS_ABI,
        functionName: 'verify',
        args: [BigInt(verifyTokenId)],
      }) as any;

      let tokenURI = 'No disponible';
      let owner = 'No disponible';

      try {
        tokenURI = await publicClient.readContract({
          address: CREDENTIALS_ADDRESS,
          abi: CREDENTIALS_ABI,
          functionName: 'tokenURI',
          args: [BigInt(verifyTokenId)],
        }) as string;
      } catch {}

      try {
        owner = await publicClient.readContract({
          address: CREDENTIALS_ADDRESS,
          abi: CREDENTIALS_ABI,
          functionName: 'ownerOf',
          args: [BigInt(verifyTokenId)],
        }) as string;
      } catch {}

      const issueDateRaw = credential.issueDate ?? credential[2];

      setVerifyResult({
        owner,
        tokenURI,
        degreeName: credential.degreeName ?? credential[0],
        studentNameHash: credential.studentNameHash ?? credential[1],
        documentHash: credential.documentHash ?? credential[3],
        issueDate: new Date(Number(issueDateRaw) * 1000).toLocaleString(),
        active: Boolean(credential.active ?? credential[4]),
        valid: Boolean(valid),
      });
    } catch (err: any) {
      setStatus(`Error al verificar: ${err.shortMessage ?? err.message}`);
    }
  }

  async function issueCredential(e: FormEvent) {
    e.preventDefault();
    setStatus('');
    setTxHash('');

    if (!isConnected || !address) {
      setStatus('Conectá una wallet.');
      return;
    }

    if (!isIssuer) {
      setStatus('La wallet conectada no tiene ISSUER_ROLE.');
      return;
    }

    if (!isAddress(studentAddress)) {
      setStatus('La dirección del estudiante no es válida.');
      return;
    }

    if (!issueTokenId || !metadataURI || !degreeName || !studentName || !documentText) {
      setStatus('Completá todos los campos de emisión.');
      return;
    }

    try {
      const studentNameHash = keccak256(stringToHex(studentName));
      const documentHash = keccak256(stringToHex(documentText));

      const hash = await writeContractAsync({
        address: CREDENTIALS_ADDRESS,
        abi: CREDENTIALS_ABI,
        functionName: 'issueCredential',
        args: [
          studentAddress as Address,
          BigInt(issueTokenId),
          degreeName,
          studentNameHash,
          documentHash,
          metadataURI,
        ],
      });

      await waitForTx(hash, 'Credencial emitida correctamente.');
    } catch (err: any) {
      setStatus(`Error al emitir: ${err.shortMessage ?? err.message}`);
    }
  }

  async function revokeCredential(e: FormEvent) {
    e.preventDefault();
    setStatus('');
    setTxHash('');

    if (!isConnected || !address) {
      setStatus('Conectá una wallet.');
      return;
    }

    if (!isIssuer) {
      setStatus('La wallet conectada no tiene ISSUER_ROLE.');
      return;
    }

    if (!revokeTokenId || !revokeReason) {
      setStatus('Ingresá tokenId y motivo de revocación.');
      return;
    }

    try {
      const hash = await writeContractAsync({
        address: CREDENTIALS_ADDRESS,
        abi: CREDENTIALS_ABI,
        functionName: 'revoke',
        args: [BigInt(revokeTokenId), revokeReason],
      });

      await waitForTx(hash, 'Credencial revocada correctamente.');
    } catch (err: any) {
      setStatus(`Error al revocar: ${err.shortMessage ?? err.message}`);
    }
  }

  async function grantIssuer(e: FormEvent) {
    e.preventDefault();
    setStatus('');
    setTxHash('');

    if (!isAdmin) {
      setStatus('La wallet conectada no tiene DEFAULT_ADMIN_ROLE.');
      return;
    }

    if (!isAddress(issuerAddress)) {
      setStatus('La dirección del issuer no es válida.');
      return;
    }

    try {
      const hash = await writeContractAsync({
        address: CREDENTIALS_ADDRESS,
        abi: CREDENTIALS_ABI,
        functionName: 'grantIssuer',
        args: [issuerAddress as Address],
      });

      await waitForTx(hash, 'Issuer agregado correctamente.');
    } catch (err: any) {
      setStatus(`Error al agregar issuer: ${err.shortMessage ?? err.message}`);
    }
  }

  async function revokeIssuer(e: FormEvent) {
    e.preventDefault();
    setStatus('');
    setTxHash('');

    if (!isAdmin) {
      setStatus('La wallet conectada no tiene DEFAULT_ADMIN_ROLE.');
      return;
    }

    if (!isAddress(issuerAddress)) {
      setStatus('La dirección del issuer no es válida.');
      return;
    }

    try {
      const hash = await writeContractAsync({
        address: CREDENTIALS_ADDRESS,
        abi: CREDENTIALS_ABI,
        functionName: 'revokeIssuer',
        args: [issuerAddress as Address],
      });

      await waitForTx(hash, 'Issuer revocado correctamente.');
    } catch (err: any) {
      setStatus(`Error al revocar issuer: ${err.shortMessage ?? err.message}`);
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '0.5rem',
    marginBottom: '0.75rem',
  };

  const sectionStyle = {
    border: '1px solid #ccc',
    borderRadius: '8px',
    padding: '1rem',
    marginTop: '1rem',
  };

  return (
    <main style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      <h1>UNQ — Credenciales académicas</h1>

      <p>Sistema de emisión y verificación de credenciales académicas sobre Base Sepolia.</p>

      <p style={{ fontSize: '0.85rem', wordBreak: 'break-all' }}>
        Contrato:{' '}
        <a href={`${BASE_SEPOLIA_ADDRESS_URL}/${CREDENTIALS_ADDRESS}`} target="_blank" rel="noopener noreferrer">
          {CREDENTIALS_ADDRESS}
        </a>
      </p>

      <ConnectButton />

      {isConnected && address && (
        <p style={{ fontSize: '0.9rem', wordBreak: 'break-all' }}>
          Wallet: {address}<br />
          DEFAULT_ADMIN_ROLE: {isAdmin ? 'sí' : 'no'}<br />
          ISSUER_ROLE: {isIssuer ? 'sí' : 'no'}
        </p>
      )}

      <section style={sectionStyle}>
        <h2>Verificación pública de credencial</h2>

        <form onSubmit={verifyCredential}>
          <input
            value={verifyTokenId}
            onChange={(e) => setVerifyTokenId(e.target.value)}
            placeholder="Token ID"
            style={inputStyle}
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
            Título: {verifyResult.degreeName}<br />
            Fecha de emisión: {verifyResult.issueDate}<br />
            Owner: {verifyResult.owner}<br />
            Token URI: {verifyResult.tokenURI}<br />
            Hash estudiante: {verifyResult.studentNameHash}<br />
            Hash documento: {verifyResult.documentHash}
          </div>
        )}
      </section>

      {isAdmin && (
        <section style={sectionStyle}>
          <h2>Administrar issuers</h2>

          <form>
            <input
              value={issuerAddress}
              onChange={(e) => setIssuerAddress(e.target.value)}
              placeholder="Wallet issuer"
              style={inputStyle}
            />

            <button onClick={grantIssuer} style={{ padding: '0.5rem 1rem', marginRight: '0.5rem' }}>
              Agregar issuer
            </button>

            <button onClick={revokeIssuer} style={{ padding: '0.5rem 1rem' }}>
              Revocar issuer
            </button>
          </form>
        </section>
      )}

      {isIssuer && (
        <>
          <section style={sectionStyle}>
            <h2>Emitir credencial</h2>

            <form onSubmit={issueCredential}>
              <input value={studentAddress} onChange={(e) => setStudentAddress(e.target.value)} placeholder="Wallet del estudiante" style={inputStyle} />
              <input value={issueTokenId} onChange={(e) => setIssueTokenId(e.target.value)} placeholder="Token ID" style={inputStyle} />
              <input value={degreeName} onChange={(e) => setDegreeName(e.target.value)} placeholder="Título" style={inputStyle} />
              <input value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="Nombre del estudiante para hash" style={inputStyle} />
              <input value={documentText} onChange={(e) => setDocumentText(e.target.value)} placeholder="Texto/documento para hash" style={inputStyle} />
              <input value={metadataURI} onChange={(e) => setMetadataURI(e.target.value)} placeholder="Metadata URI" style={inputStyle} />

              <button type="submit" style={{ padding: '0.5rem 1rem' }}>
                Emitir
              </button>
            </form>
          </section>

          <section style={sectionStyle}>
            <h2>Revocar credencial</h2>

            <form onSubmit={revokeCredential}>
              <input value={revokeTokenId} onChange={(e) => setRevokeTokenId(e.target.value)} placeholder="Token ID" style={inputStyle} />
              <input value={revokeReason} onChange={(e) => setRevokeReason(e.target.value)} placeholder="Motivo de revocación" style={inputStyle} />

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
