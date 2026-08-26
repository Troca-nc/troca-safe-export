'use strict';

const assert = require('assert');
const { describe, it } = require('../helpers');
const { mapMessageRow } = require('../../services/messagePresentation');

function withJwtSecret(fn) {
  const previous = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'security-test-message-media-secret';
  try {
    return fn();
  } finally {
    if (previous == null) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previous;
  }
}

describe('P0-D private message media presentation', () => {
  it('remplace les URL brutes des photos et audios par une URL signee', () => {
    withJwtSecret(() => {
      for (const type of ['photo', 'audio']) {
        const mapped = mapMessageRow({
          id: type === 'photo' ? 101 : 102,
          conv_id: 8,
          sender_id: 4,
          type,
          content: null,
          photo_url: `https://kalico-nc.com/uploads/chat/4/private-${type}.bin`,
          created_at: new Date().toISOString(),
        }, 8, 4);

        assert.match(mapped.photo_url, /\/api\/messages\/attachments\/10[12]\/download\?token=/);
        assert.doesNotMatch(mapped.photo_url, /\/uploads\/chat\//);
        assert.strictEqual(mapped.attachment_url, null);
      }
    });
  });

  it('ne renvoie jamais l URL brute d un document', () => {
    withJwtSecret(() => {
      const mapped = mapMessageRow({
        id: 103,
        conv_id: 8,
        sender_id: 4,
        type: 'document',
        content: null,
        attachment_url: 'https://kalico-nc.com/uploads/chat/4/private.pdf',
        attachment_name: 'private.pdf',
        created_at: new Date().toISOString(),
      }, 8, 4);

      assert.strictEqual(mapped.attachment_url, null);
      assert.match(mapped.attachment_download_url, /\/api\/messages\/attachments\/103\/download\?token=/);
      assert.doesNotMatch(mapped.attachment_download_url, /\/uploads\/chat\//);
    });
  });
});
