module.exports = async function adminCheck(sock, jid, senderId, botId) {
  const metadata = await sock.groupMetadata(jid);

  const botParticipant = metadata.participants.find(p => p.id === botId);
  const isBotAdmin = botParticipant ? botParticipant.admin !== null : false;

  const senderParticipant = metadata.participants.find(p => p.id === senderId);
  const isSenderAdmin = senderParticipant ? senderParticipant.admin !== null : false;

  return { isBotAdmin, isSenderAdmin };
};
