import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  template: `
    <div class="row justify-content-center">
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            <h4>Login</h4>
          </div>
          <div class="card-body">
            <div class="mb-3">
              <label class="form-label">Role</label>
              <select class="form-select" [(ngModel)]="role">
                <option value="citizen">Citizen</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            
            <div *ngIf="role === 'citizen'" class="mb-3">
              <label class="form-label">Email</label>
              <input type="email" class="form-control" [(ngModel)]="email">
            </div>
            
            <div class="mb-3">
              <label class="form-label">Password</label>
              <input type="password" class="form-control" [(ngModel)]="password">
            </div>
            
            <div *ngIf="error" class="alert alert-danger">
              {{ error }}
            </div>
            
            <button class="btn btn-primary" (click)="login()">Login</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  role: string = 'citizen';
  email: string = '';
  password: string = '';
  error: string = '';
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) { }
  
  login(): void {
    this.error = '';
    this.authService.login(this.role, this.email, this.password).subscribe({
      next: (response) => {
        if (response.ok) {
          if (this.role === 'admin') {
            this.router.navigate(['/admin']);
          } else {
            this.router.navigate(['/dashboard']);
          }
        }
      },
      error: (err) => {
        this.error = err.error?.error || 'Login failed';
      }
    });
  }
}