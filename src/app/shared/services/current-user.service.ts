import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { identityService } from '../../../api/identityService';

export interface CurrentUser {
  id: number;
  fullName: string;
  avatar: string;
  phone: string;
  publicBio: string;
  email: string;
  address?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CurrentUserService {

  private userSource = new BehaviorSubject<CurrentUser | null>(null);
  currentUser$ = this.userSource.asObservable();
  constructor() { }

  loadUser(userId: number): Observable<CurrentUser> {
    return from(identityService.getProfile(userId)).pipe(
      map(profile => {
        return {
          id: profile.id,
          fullName: profile.fullName,
          avatar: profile.avatarUrl,
          phone: profile.phone,
          publicBio: profile.publicBio,
          email: profile.email,
          address: profile.address
        } as CurrentUser;
      }),
      tap(user => this.userSource.next(user))
    );
  }

  updateCurrentUser(updatedData: Partial<CurrentUser>): void {
    const currentUser = this.userSource.getValue();
    if (currentUser) {
      const newUser = { ...currentUser, ...updatedData };
      this.userSource.next(newUser);
    }
  }

  getCurrentUserSnapshot(): CurrentUser | null {
    return this.userSource.getValue();
  }

  clearUser(): void {
    this.userSource.next(null);
  }
}
