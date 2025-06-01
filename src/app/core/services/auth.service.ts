import { inject, Injectable, signal } from '@angular/core';
import { GoogleAuthProvider, UserCredential } from '@angular/fire/auth';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import firebase from 'firebase/compat/app';
import { catchError, from, map, Observable, of } from 'rxjs';

import { AuthUser, VoteTypes } from '../interfaces';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly #afAuth = inject(AngularFireAuth);
  public authUser = signal<AuthUser | null>(null);
  public currentUser$ = this.#afAuth.authState;
  public isAuthenticated$ = this.currentUser$.pipe(map(Boolean));
  public signUp(email: string, password: string) {
    return from(this.#afAuth.createUserWithEmailAndPassword(email, password));
  }

  public setCurrentUser(user: AuthUser): void {
    this.authUser.set(user);
  }

  public decrementUserStarsLocally(type: VoteTypes): void {
    const user = this.authUser();
    if (user) {
      this.authUser.update(user => {
        if (!user) return user;
        return {
          ...user,
          stars: {
            ...user.stars!,
            [type]: (user.stars![type] ?? 0) - 1
          }
        };
      });
    }
  }

  public signIn(email: string, password: string): Observable<UserCredential> {
    return from(this.#afAuth.signInWithEmailAndPassword(email, password)).pipe(
      catchError(error => {
        var errorCode = error.code;
        var errorMessage = error.message;
        if (errorCode === 'auth/wrong-password') {
          alert('Wrong password.');
        } else {
          alert(errorMessage);
        }
        return of(error);
      })
    );
  }

  public signInWithGoogle(): Observable<firebase.auth.UserCredential> {
    return from(this.#afAuth.signInWithPopup(new GoogleAuthProvider()));
  }

  public signOut(): Observable<void> {
    return from(this.#afAuth.signOut());
  }
}
