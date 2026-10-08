import { Injectable } from '@angular/core';

import { FirestoreCollections, StorageFolders, VoteTypes } from '../core';

@Injectable()
export class PrivateService {
  public mapTypeToResultsCollection(type: VoteTypes): FirestoreCollections {
    switch (type) {
      case VoteTypes.cosplay:
        return FirestoreCollections.cosplaySoloResults;
      case VoteTypes.cosplayTeam:
        return FirestoreCollections.cosplayTeamResults;
      case VoteTypes.kpop:
        return FirestoreCollections.kPopResults;
    }
  }

  public mapTypeToCollection(type: VoteTypes): FirestoreCollections {
    switch (type) {
      case VoteTypes.cosplay:
        return FirestoreCollections.cosplaySolo;
      case VoteTypes.cosplayTeam:
        return FirestoreCollections.cosplayTeams;
      case VoteTypes.kpop:
        return FirestoreCollections.kPop;
    }
  }

  public mapTypeToCriteriaCollection(type: VoteTypes): FirestoreCollections {
    switch (type) {
      case VoteTypes.cosplay:
        return FirestoreCollections.cosplaySoloCriteria;
      case VoteTypes.cosplayTeam:
        return FirestoreCollections.cosplayTeamCriteria;
      case VoteTypes.kpop:
        return FirestoreCollections.kPopCriteria;
    }
  }

  public mapTypeToCraftStorageFolder(type: VoteTypes): StorageFolders | null {
    switch (type) {
      case VoteTypes.cosplay:
        return StorageFolders.cosplayCraft;
      case VoteTypes.cosplayTeam:
        return StorageFolders.cosplayTeamCraft;
      case VoteTypes.kpop:
        return null;
    }
  }
}
