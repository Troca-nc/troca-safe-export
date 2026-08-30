'use strict';

// A push ticket proves Expo acceptance, NOT receipt on the user's device.
async function sendCampaignPush(token, payload) {
  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST', redirect: 'error', signal: AbortSignal.timeout(15000),
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify([{ to: token, sound: 'default', badge: 1, channelId: 'default', ...payload }]),
  });
  if (!response.ok) return { status: 'retry' };
  const body = await response.json();
  if (!Array.isArray(body.data) || body.data.length !== 1) return { status: 'retry' };
  const ticket = body.data[0];
  if (ticket.status === 'ok' && typeof ticket.id === 'string' && ticket.id) return { status: 'sent' };
  if (ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered') return { status: 'skipped' };
  return { status: 'retry' };
}
module.exports = { sendCampaignPush };
