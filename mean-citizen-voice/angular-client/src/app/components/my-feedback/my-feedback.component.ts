import { Component, OnInit } from '@angular/core';
import { FeedbackService } from '../../services/feedback.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-my-feedback',
  template: `
    <h2>My Feedback</h2>
    <div *ngIf="loading" class="text-center">
      <p>Loading...</p>
    </div>
    <div *ngIf="!loading && feedback.length === 0" class="alert alert-info">
      You haven't submitted any feedback yet.
    </div>
    <div *ngIf="!loading && feedback.length > 0" class="list-group">
      <div *ngFor="let item of feedback" class="list-group-item">
        <h5 class="mb-1">{{item.title}}</h5>
        <p class="mb-1">{{item.description}}</p>
        <small>Category: {{item.category}} | Status: {{item.status}}</small>
      </div>
    </div>
  `
})
export class MyFeedbackComponent implements OnInit {
  feedback: any[] = [];
  loading = true;
  
  constructor(
    private feedbackService: FeedbackService,
    private authService: AuthService
  ) {}
  
  ngOnInit(): void {
    this.loadFeedback();
  }
  
  loadFeedback(): void {
    const email = this.authService.getUserEmail();
    if (!email) return;
    
    this.feedbackService.getFeedback({ email }).subscribe({
      next: (data) => {
        this.feedback = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load feedback', err);
        this.loading = false;
      }
    });
  }
}