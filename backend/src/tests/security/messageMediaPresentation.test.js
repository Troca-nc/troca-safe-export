'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { describe, it } = require('../helpers');
const { mapMessageRow } = require('../../services/messagePresentation');

describe('P0-D private message media presentation', () => {
  it('remplace les URL brutes des photos et audios par une route authentifiee sans token', () => {
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

        assert.match(mapped.photo_url, /^\/messages\/attachments\/10[12]\/download$/);
        assert.doesNotMatch(mapped.photo_url, /token=/);
        assert.doesNotMatch(mapped.photo_url, /\/uploads\/chat\//);
        assert.strictEqual(mapped.attachment_url, null);
      }
  });

  it('ne renvoie jamais l URL brute d un document', () => {
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
      assert.strictEqual(mapped.attachment_download_url, '/messages/attachments/103/download');
      assert.doesNotMatch(mapped.attachment_download_url, /token=/);
      assert.doesNotMatch(mapped.attachment_download_url, /\/uploads\/chat\//);
  });

  it('protege toujours le telechargement par la session authentifiee', () => {
    const route = fs.readFileSync(path.resolve(__dirname, '../../routes/messages.js'), 'utf8');

    assert.ok(route.includes('router.use(authenticate)'));
    assert.doesNotMatch(route, /req\.query\??\.token/);
    assert.doesNotMatch(route, /verifyAttachmentDownloadToken/);
  });
});
