/**
 * National Crisis & Student Mental Health Helplines
 *
 * IMPORTANT STATUS NOTICE:
 * Status: unverified – owner to confirm
 * The project owner must re-verify these numbers against the official government websites before deployment.
 *
 * Official sources:
 * - Tele-MANAS (14416): https://telemanas.mohfw.gov.in/ (National Tele Mental Health Programme)
 * - KIRAN (1800-599-0019): https://depwd.gov.in/ (Dept of Empowerment of Persons with Disabilities, MSJE)
 *
 * Last verified date: 2026-10-11
 */

const path = require('path');
const helplinesData = require('../config/helplines.json');

const TELE_MANAS_NUMBER = '14416';
const KIRAN_NUMBER = '1800-599-0019';
const LAST_VERIFIED = '2026-10-11';
const STATUS_NOTICE = 'unverified – owner to confirm';

function getHelplines() {
  return helplinesData.helplines;
}

function formatHelplinesText() {
  const isDevOrTest = process.env.NODE_ENV !== 'production';
  const lines = helplinesData.helplines.map(h => {
    const unverifiedNotice = (!h.verified && isDevOrTest) ? ' [unverified – owner to confirm]' : '';
    return `• **${h.name}**: Call ${h.number} (${h.cost}, ${h.hours})${unverifiedNotice}`;
  });
  return lines.join('\n');
}

module.exports = {
  TELE_MANAS_NUMBER,
  KIRAN_NUMBER,
  LAST_VERIFIED,
  STATUS_NOTICE,
  getHelplines,
  formatHelplinesText,
  helplinesData
};
