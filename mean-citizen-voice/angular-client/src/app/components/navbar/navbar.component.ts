import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  template: `
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
      <div class="container">
        <a class="navbar-brand" routerLink="/">Citizen Voice</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav me-auto">
            <li class="nav-item">
              <a class="nav-link" routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">Home</a>
            </li>
            <li class="nav-item" *ngIf="authService.isLoggedIn()">
              <a class="nav-link" routerLink="/dashboard" routerLinkActive="active">Dashboard</a>
            </li>
            <li class="nav-item" *ngIf="authService.isLoggedIn()">
              <a class="nav-link" routerLink="/submit" routerLinkActive="active">Submit Feedback</a>
            </li>
            <li class="nav-item" *ngIf="authService.isLoggedIn()">
              <a class="nav-link" routerLink="/surveys" routerLinkActive="active">Surveys</a>
            </li>
            <li class="nav-item" *ngIf="authService.isLoggedIn()">
              <a class="nav-link" routerLink="/mine" routerLinkActive="active">My Feedback</a>
            </li>
            <li class="nav-item" *ngIf="authService.isAdmin()">
              <a class="nav-link" routerLink="/admin" routerLinkActive="active">Admin</a>
            </li>
          </ul>
          <ul class="navbar-nav">
            <li class="nav-item" *ngIf="!authService.isLoggedIn()">
              <a class="nav-link" routerLink="/login" routerLinkActive="active">Login</a>
            </li>
            <li class="nav-item" *ngIf="authService.isLoggedIn()">
              <a class="nav-link" (click)="logout()" style="cursor: pointer;">Logout</a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  `
})
export class NavbarComponent {
  constructor(
    public authService: AuthService,
    private router: Router
  ) { }
  
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}