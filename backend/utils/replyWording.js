/**
 * Honest Reply Wording Utility
 *
 * Rules:
 * - delivered -> "I've sent your request to your mentor ({mentor display name if known})."
 * - saved but not delivered -> "I've recorded your request but couldn't reach your mentor's inbox right now. Please also contact {configured contact or mentor directly}."
 * - not saved -> helplines and direct-contact guidance only; no claim that anything was recorded.
 */

function buildDeliveryReplyWording({ deliveryStatus, mentorName, counsellingInfo, isCrisis = false }) {
  const mentorDisplay = mentorName && mentorName.trim() ? mentorName.trim() : null;
  const rawContact = counsellingInfo?.displayText || 'your mentor or the college counselling centre directly';

  if (deliveryStatus === 'delivered') {
    if (mentorDisplay) {
      return `I've sent your request to your mentor (${mentorDisplay}).`;
    }
    return "I've sent your request to your mentor.";
  }

  // Normalize contact phrase
  let cleaned = rawContact.trim().replace(/\.+$/, '');
  const hasPleaseContact = /^please\s+(contact|reach\s+out\s+to)\s+/i.test(cleaned);
  const contactTarget = hasPleaseContact
    ? cleaned.replace(/^please\s+(contact|reach\s+out\s+to)\s+/i, '')
    : cleaned;

  if (deliveryStatus === 'pending' || deliveryStatus === 'failed') {
    if (hasPleaseContact) {
      return `I've recorded your request but couldn't reach your mentor's inbox right now. ${cleaned}.`;
    }
    const prefix = counsellingInfo?.hasContact ? 'the ' : '';
    return `I've recorded your request but couldn't reach your mentor's inbox right now. Please also contact ${prefix}${contactTarget}.`;
  }

  // not_saved or null
  if (isCrisis) {
    const prefix = counsellingInfo?.hasContact ? 'the ' : '';
    return `Please call the emergency helplines above or contact ${prefix}${contactTarget}.`;
  }
  return `Please reach out directly to ${mentorDisplay || 'your mentor'} or the college counselling centre.`;
}

module.exports = {
  buildDeliveryReplyWording
};
