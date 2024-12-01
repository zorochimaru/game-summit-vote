import { queryParamKeys, Roles, VoteTypes } from '../../core';
import { CardLink } from './card-link.interface';

const allCards: Record<Roles.cosplay | Roles.kpop, CardLink[]> = {
  cosplay: [
    { type: VoteTypes.cosplay, title: 'Cosplay', icon: 'person' },
    { type: VoteTypes.cosplayTeam, title: 'Cosplay Team', icon: 'group' }
  ],
  kpop: [
    { type: VoteTypes.kpop, title: 'Kpop', icon: 'person' },
    { type: VoteTypes.kpopTeam, title: 'Kpop Team', icon: 'group' }
  ]
};

export const dashboardCards: Record<Roles, CardLink[]> = {
  [Roles.administrator]: [...allCards.cosplay, ...allCards.kpop],
  [Roles.cosplay]: allCards.cosplay,
  [Roles.kpop]: allCards.kpop
};
