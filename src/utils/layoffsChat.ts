// Chat chokepoint for the layoffs + neglect systems.
// Every chat message passes through here before it lands:
//  • people who were cut don't post anymore (chat gets quieter)
//  • people the player keeps leaving off the team slowly start sounding like AI
import type { ChatMessage } from '../types/chat';
import { CORE_ROLES, getNeglectStage, isCut } from './layoffsStore';
import { FLAT_LINES } from '../data/layoffsDialogue';

const SCRIPTED_PREFIX = 'lay-'; // layoffs system messages are never filtered

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function filterIncomingMessage(msg: ChatMessage): ChatMessage | null {
  if (msg.id.startsWith(SCRIPTED_PREFIX)) return msg;
  if (!(CORE_ROLES as readonly string[]).includes(msg.authorId)) return msg;

  if (isCut(msg.authorId)) return null;

  const stage = getNeglectStage(msg.authorId);
  if (stage === 0 || !msg.text) return msg;

  if (stage === 1) {
    return Math.random() < 0.4 ? { ...msg, text: `${msg.text} 🚀` } : msg;
  }
  if (stage === 2) {
    const text = Math.random() < 0.5
      ? `Great question! ${msg.text}`
      : `Here are a few thoughts:\n1. ${msg.text}\n2. Happy to iterate on this!`;
    return { ...msg, text };
  }
  // stage 3 — fully flattened. Images and memes stop too.
  const pool = FLAT_LINES[msg.authorId] ?? ['Great question!'];
  return {
    ...msg,
    text: pick(pool),
    imageUrl: undefined,
    pendingImageUrl: undefined,
    memeData: undefined,
    tableData: undefined,
  };
}
