import { inject, Injectable } from '@angular/core';
import { UserCredential } from '@angular/fire/auth';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { catchError, from, map, Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly #afAuth = inject(AngularFireAuth);

  public currentUser$ = this.#afAuth.authState;
  public isAuthenticated$ = this.currentUser$.pipe(map(Boolean));

  public signUp(email: string, password: string): Observable<void> {
    return from(
      this.#afAuth.createUserWithEmailAndPassword(email, password)
    ).pipe(map(() => void 0));
  }

  public signIn({
    email,
    password
  }: {
    email: string;
    password: string;
  }): Observable<UserCredential> {
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

  public signOut(): Observable<void> {
    return from(this.#afAuth.signOut());
  }
}
