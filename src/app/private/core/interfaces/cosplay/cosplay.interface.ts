import { CommonVoteItem } from '../common-vote-item.interface';
import { CraftMedia } from '../craft-media.interface';

export interface Cosplay extends CommonVoteItem {
  craftMedia?: CraftMedia[];
  fandom: string;
  fandomType: string;
  costumeType: string;
  sceneDescription: string;
}
