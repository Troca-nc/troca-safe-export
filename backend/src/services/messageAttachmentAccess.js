'use strict';

function buildAttachmentDownloadUrl(messageId, userId) {
  if (!messageId || !userId) return null;
  return `/messages/attachments/${Number(messageId)}/download`;
}

module.exports = {
  buildAttachmentDownloadUrl,
};
