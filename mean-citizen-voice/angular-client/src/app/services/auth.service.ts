import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:4001/api';
  
  constructor(private http: HttpClient) { }
  
  login(role: string, email?: string, password?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/login`, { role, email, password })
      .pipe(
        tap((response: any) => {
          if (response.ok) {
            localStorage.setItem('role', role);
            if (email) localStorage.setItem('userEmail', email);
          }
        })
      );
  }
  
  logout(): void {
    localStorage.removeItem('role');
    localStorage.removeItem('userEmail');
  }
  
  isLoggedIn(): boolean {
    return !!localStorage.getItem('role');
  }
  
  isAdmin(): boolean {
    return localStorage.getItem('role') === 'admin';
  }
  
  getUserEmail(): string | null {
    return localStorage.getItem('userEmail');
  }
}