import { EventEmitter } from "node:events";

type ScrapCreatedEvent = {
  scrapID: string;
  authorUserID: string;
  recipientUserID: string;
};

const scrapEvents = new EventEmitter();

export { scrapEvents };
export type { ScrapCreatedEvent };
