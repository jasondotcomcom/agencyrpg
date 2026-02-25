import type { Email } from '../types/email';

/**
 * Taylor Kim's email asking the player to name their agency.
 * Delivered as the very first email (before briefs), so it gets buried
 * at the bottom of the inbox as later emails stack on top.
 */
export function buildNamingEmail(playerName: string): Email {
  return {
    id: 'agency-naming-001',
    type: 'team_message',
    from: {
      name: 'Taylor Kim',
      email: 'taylor@agency.internal',
      avatar: '📋',
    },
    subject: 'We need a name for this place',
    body: `Hey ${playerName},

Quick thing before we get buried in briefs.

Right now we're just "${playerName}'s Agency" on everything — business cards, email signatures, the sign on the door. Casey from accounts asked me yesterday what to put on the new letterhead and I genuinely didn't know what to tell her.

I know naming things is kind of our whole job, but somehow we never got around to naming ourselves.

No pressure, but if you have something in mind — or want to brainstorm — now's a good time. Before we start landing clients and have to explain why our agency doesn't have a real name.

Or we can just keep "${playerName}'s Agency." It's fine. It's just... you know. Fine.

— Taylor
Project Manager`,
    timestamp: new Date(),
    isRead: false,
    isStarred: false,
    isDeleted: false,
  };
}

/** Taylor's chat response when the player names the agency */
export const NAMING_CHAT_RESPONSES = {
  custom: [
    "Love it. Updating everything now — letterhead, email signatures, the works. Casey's going to be thrilled.",
    "Perfect. That actually sounds like a real agency. I'll get the business cards reprinted.",
    "Done. It's official. I've already updated the company Slack, email signatures, and told Casey to hold on the old letterhead.",
  ],
  keptDefault: [
    "Alright, we're keeping it. I'll tell Casey to just go with what we have. It works!",
    "Fair enough — if it ain't broke. Casey will have the letterhead done by end of day.",
  ],
  renamed: [
    "A rebrand! I'll start updating everything. Casey's going to give me a look, but she'll get over it.",
    "New name, new energy. Updating the letterhead, email sigs, and the door sign. Again.",
  ],
};

/** Taylor's reminder if they ignore the naming email too long */
export const NAMING_REMINDER = "Hey, no rush on the agency name thing, but Casey printed 500 business cards that just say \"{playerName}'s Agency\" and she's... not thrilled about it. Just saying.";
