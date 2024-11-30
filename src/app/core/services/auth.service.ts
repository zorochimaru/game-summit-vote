import { inject, Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { from, map, Observable } from 'rxjs';

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

  public signIn(email: string, password: string): Observable<void> {
    return from(this.#afAuth.signInWithEmailAndPassword(email, password)).pipe(
      map(() => void 0)
    );
  }

  public signOut(): Observable<void> {
    return from(this.#afAuth.signOut());
  }
}
