import type { Email } from '../types/email';
import type { BonusEvent } from '../types/reputation';
import { BONUS_EVENT_CONFIG } from '../types/reputation';
import { teamMembers } from '../data/team';

// Get team member info by id
function getTeamMember(id: string) {
  return teamMembers.find(m => m.id === id);
}

// Generate email from bonus event
export function generateBonusEmail(event: BonusEvent): Email {
  const config = BONUS_EVENT_CONFIG[event.type];
  const teamMember = getTeamMember(config.emailFrom);

  const { subject, body } = getEmailContent(event);

  return {
    id: `bonus_${event.id}`,
    type: 'reputation_bonus',
    from: {
      name: teamMember?.name || 'Agency Team',
      email: `${config.emailFrom}@agency.co`,
      avatar: teamMember?.avatar,
    },
    subject,
    body,
    timestamp: new Date(event.scheduledFor),
    isRead: false,
    isStarred: false,
    isDeleted: false,
    reputationBonus: {
      eventType: event.type,
      campaignName: event.campaignId,
      reputationChange: event.reputationChange,
    },
  };
}

// Get email content based on event type
function getEmailContent(event: BonusEvent): { subject: string; body: string } {
  const repDisplay = event.reputationChange > 0
    ? `+${event.reputationChange}`
    : `${event.reputationChange}`;

  switch (event.type) {
    // AWARDS
    case 'award_local':
      return {
        subject: `🏆 WE WON - ${event.title}`,
        body: `Just got the call - that campaign won a regional award! GOLD.\n\nThe team is losing it. Copywriter is crying (happy tears). This is what we left corporate for.\n\nAGENCY REPUTATION: ${repDisplay}`,
      };

    case 'award_national':
      return {
        subject: `🏆🏆 NATIONAL AWARD - ${event.title}`,
        body: `DUDE.\n\nWe just got nominated AND WON at the national advertising awards. This is insane. The work is getting recognized on a NATIONAL level.\n\nCopywriter printed the announcement and taped it to their monitor. Art Director is pretending to be chill but I saw them tearing up.\n\nThis is the dream. We're building something real.\n\nAGENCY REPUTATION: ${repDisplay}`,
      };

    case 'award_cannes':
      return {
        subject: `🦁🦁🦁 CANNES LION!!!`,
        body: `I don't even know where to start.\n\nWE WON A CANNES LION.\n\nA CANNES. LION.\n\nThis is the one. The big one. The one everyone in the industry dreams about. And we did it.\n\nThe whole team is in shock. Strategist keeps refreshing the Cannes website like it might change. Copywriter is writing acceptance speech drafts. I'm booking flights.\n\nThis changes everything for us. EVERYTHING.\n\nAGENCY REPUTATION: ${repDisplay}\n\nWe made it. 🦁`,
      };

    // VIRAL/CULTURAL
    case 'viral_social':
      return {
        subject: `📱 Your thing is EVERYWHERE`,
        body: `Dude. Your TikTok thing is EVERYWHERE.\n\n2.4M views. People making remixes. Client called freaking out (good way).\n\nStrategist keeps refreshing the count. We might need to do a "brand response" while it's hot.\n\nAGENCY REPUTATION: ${repDisplay}`,
      };

    case 'viral_press':
      return {
        subject: `📰 We're in Ad Age!!!`,
        body: `So... Ad Age and The Drum just wrote about our work.\n\nLike, actual trade press. Writing about OUR agency. OUR campaign.\n\nI've been sharing the link with literally everyone. My mom doesn't get it but she's proud.\n\nAGENCY REPUTATION: ${repDisplay}`,
      };

    case 'viral_meme':
      return {
        subject: `🔥 It became a MEME`,
        body: `OK so remember that thing we made?\n\nIt's a meme now. People are making versions of it. There are Twitter threads analyzing it. Someone made a remix that has 500K views.\n\nThis is... a lot. In a good way? I think?\n\nClient is thrilled. We're a cultural moment. What is happening.\n\nAGENCY REPUTATION: ${repDisplay}`,
      };

    case 'viral_industry':
      return {
        subject: `💬 LinkedIn won't shut up about us`,
        body: `Have you been on LinkedIn today?\n\nEveryone's talking about the campaign. Hot takes. Counter-takes. Takes about the takes. The usual LinkedIn discourse machine but... about US.\n\nEven saw some agency founders I respect sharing it. This is good for visibility.\n\nAGENCY REPUTATION: ${repDisplay}`,
      };

    // CLIENT RELATIONSHIPS
    case 'client_return':
      return {
        subject: `📞 They want more!`,
        body: `Good news - the client just called.\n\nThey want us for their next thing. Bigger scope. They specifically said they loved working with us and want to keep the momentum going.\n\nTold you that campaign would pay off. This is how you build a roster.\n\nAGENCY REPUTATION: ${repDisplay}`,
      };

    case 'client_referral':
      return {
        subject: `🎯 New lead from referral`,
        body: `OK so get this.\n\nJust got a call from a brand I've never spoken to. They said our client REFERRED them to us. Like, unprompted.\n\nThat's the dream right? Do good work, clients tell other clients. We're building actual word-of-mouth.\n\nSetting up the intro call.\n\nAGENCY REPUTATION: ${repDisplay}`,
      };

    case 'client_word_of_mouth':
      return {
        subject: `👂 People are talking...`,
        body: `Heard through the grapevine that good things are being said about us.\n\nNothing specific yet but the vibes are good. Reputation is building. This is how it starts.\n\nKeep doing what we're doing.\n\nAGENCY REPUTATION: ${repDisplay}`,
      };

    // MILESTONES
    case 'milestone_campaigns':
      return {
        subject: `📊 Milestone hit!`,
        body: `Hey - we hit a milestone.\n\nRemember when we were terrified about landing ONE campaign? Look at us now.\n\nThe spreadsheet looks good. We're actually doing this. For real.\n\nOrdered pizza for the team. They deserve it.\n\nAGENCY REPUTATION: ${repDisplay}`,
      };

    case 'milestone_quality':
      return {
        subject: `⭐ Quality streak!`,
        body: `Just ran the numbers.\n\nWe've hit multiple high-quality campaigns in a row. That's not luck - that's consistency. That's what separates flash-in-the-pan agencies from ones that last.\n\nProud of what we're building.\n\nAGENCY REPUTATION: ${repDisplay}`,
      };

    case 'milestone_diversity':
      return {
        subject: `🌈 Portfolio diversified`,
        body: `Noticed something cool when reviewing our work.\n\nWe've now worked across multiple different industries. That's versatility. That's range. That's what clients want to see.\n\nNo one can say we're a one-trick pony.\n\nAGENCY REPUTATION: ${repDisplay}`,
      };

    case 'milestone_efficiency':
      return {
        subject: `💰 Budget efficiency streak!`,
        body: `The numbers don't lie.\n\nWe've consistently delivered quality work under budget. That's not cutting corners - that's smart resource management.\n\nClients notice this stuff. Trust me.\n\nAGENCY REPUTATION: ${repDisplay}`,
      };

    // TEAM RECOGNITION
    case 'team_featured':
      return {
        subject: `📸 Someone got featured!`,
        body: `So... one of our team members just got profiled in industry press.\n\nThey're being recognized for the work we've been doing together. It's a good look for all of us.\n\nWhen individuals shine, the agency shines.\n\nAGENCY REPUTATION: ${repDisplay}`,
      };

    case 'team_speaking':
      return {
        subject: `🎤 Speaking opportunity!`,
        body: `So... 99U Conference wants me to present our approach.\n\nMe. Speaking. About OUR work. Wild, right?\n\nThis is good for us. Real visibility. Want to help me not embarrass us?\n\nAGENCY REPUTATION: ${repDisplay}`,
      };

    // NEGATIVE EVENTS
    case 'negative_backlash':
      return {
        subject: `😬 We need to talk...`,
        body: `Okay so... that bold concept? Not landing great.\n\nTwitter has Opinions. Client fielding angry emails. This might sting.\n\nLook - this happens sometimes when you take swings. We'll bounce back. We always do.\n\nMaybe play it a bit safer next time? Team's still got your back. 💪\n\nAGENCY REPUTATION: ${repDisplay}`,
      };

    case 'negative_client_unhappy':
      return {
        subject: `⚠️ Client concerns`,
        body: `Got some not-great feedback from the client.\n\nThey're expressing concerns about the direction. Nothing catastrophic but not the reaction we wanted.\n\nLet's debrief and figure out how to course correct. Every stumble is a learning opportunity.\n\nAGENCY REPUTATION: ${repDisplay}`,
      };

    case 'negative_burnout':
      return {
        subject: `💭 Team check-in`,
        body: `Hey, wanted to flag something.\n\nThe team is showing signs of burnout. Late nights, stressed vibes, people getting snippy.\n\nI know we're pushing hard but we need to watch the pace. Burned out creatives don't make good work.\n\nMaybe ease up a bit? Quality over quantity.\n\nAGENCY REPUTATION: ${repDisplay}`,
      };

    default:
      return {
        subject: event.title,
        body: `${event.description}\n\nAGENCY REPUTATION: ${repDisplay}`,
      };
  }
}
