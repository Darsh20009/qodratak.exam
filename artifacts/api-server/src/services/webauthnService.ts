import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';

const RP_NAME = 'منصة قدراتك';

const pendingChallenges = new Map<string, string>();

function getRpId(origin: string): string {
  try {
    const url = new URL(origin);
    return url.hostname;
  } catch {
    return 'localhost';
  }
}

function getEffectiveOriginAndRpId(requestOrigin?: string): { origin: string; rpId: string } {
  if (requestOrigin && requestOrigin !== 'null' && requestOrigin !== '') {
    const rpId = getRpId(requestOrigin);
    return { origin: requestOrigin, rpId };
  }

  const configuredOrigin = process.env.WEBAUTHN_ORIGIN || process.env.APP_URL;
  if (configuredOrigin) {
    return {
      origin: configuredOrigin,
      rpId: process.env.WEBAUTHN_RP_ID || getRpId(configuredOrigin),
    };
  }

  return { origin: 'http://localhost:5000', rpId: 'localhost' };
}

export async function getRegistrationOptions(
  userId: string,
  username: string,
  existingCredentialIds: string[],
  requestOrigin?: string
) {
  const { rpId } = getEffectiveOriginAndRpId(requestOrigin);

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: rpId,
    userID: new TextEncoder().encode(userId),
    userName: username,
    userDisplayName: username,
    timeout: 60000,
    attestationType: 'none',
    excludeCredentials: existingCredentialIds.map(id => ({
      id: id,
      type: 'public-key',
      transports: ['internal'],
    })),
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
      authenticatorAttachment: 'platform',
    },
  });

  pendingChallenges.set(`reg-${userId}`, options.challenge);

  return options;
}

export async function verifyRegistration(userId: string, response: any, requestOrigin?: string) {
  const expectedChallenge = pendingChallenges.get(`reg-${userId}`);
  if (!expectedChallenge) {
    throw new Error('لم يتم العثور على التحدي. يرجى المحاولة مجدداً');
  }

  const { origin, rpId } = getEffectiveOriginAndRpId(requestOrigin);

  const verification = await verifyRegistrationResponse({
    response,
    expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpId,
  });

  pendingChallenges.delete(`reg-${userId}`);

  if (verification.verified && verification.registrationInfo) {
    return {
      verified: true,
      credentialID: Buffer.from(verification.registrationInfo.credential.id).toString('base64url'),
      credentialPublicKey: Buffer.from(verification.registrationInfo.credential.publicKey).toString('base64'),
      counter: verification.registrationInfo.credential.counter,
    };
  }

  return { verified: false };
}

export async function getAuthenticationOptions(credentialIds: string[], requestOrigin?: string) {
  const { rpId } = getEffectiveOriginAndRpId(requestOrigin);

  const options = await generateAuthenticationOptions({
    rpID: rpId,
    timeout: 60000,
    allowCredentials: credentialIds.map(id => ({
      id: id,
      type: 'public-key',
      transports: ['internal'],
    })),
    userVerification: 'preferred',
  });

  pendingChallenges.set(`auth-challenge`, options.challenge);

  return options;
}

export async function verifyAuthentication(
  response: any,
  credential: { credentialPublicKey: string; credentialID: string; counter: number },
  requestOrigin?: string
) {
  const expectedChallenge = pendingChallenges.get(`auth-challenge`);
  if (!expectedChallenge) {
    throw new Error('لم يتم العثور على التحدي');
  }

  const { origin, rpId } = getEffectiveOriginAndRpId(requestOrigin);

  const verification = await verifyAuthenticationResponse({
    response,
    expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpId,
    credential: {
      id: credential.credentialID,
      publicKey: Buffer.from(credential.credentialPublicKey, 'base64'),
      counter: credential.counter,
    },
  });

  pendingChallenges.delete(`auth-challenge`);

  return {
    verified: verification.verified,
    newCounter: verification.authenticationInfo?.newCounter || credential.counter,
  };
}
