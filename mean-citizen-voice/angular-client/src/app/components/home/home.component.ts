import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  template: `
    <div class="jumbotron bg-light p-5 rounded">
      <h1>Welcome to Citizen Voice</h1>
      <p class="lead">A platform for citizens to provide feedback and participate in surveys.</p>
      <hr class="my-4">
      <p>Login to submit feedback or participate in surveys.</p>
      <a class="btn btn-primary btn-lg" routerLink="/login">Get Started</a>
    </div>
  `
})
export class HomeComponent {}