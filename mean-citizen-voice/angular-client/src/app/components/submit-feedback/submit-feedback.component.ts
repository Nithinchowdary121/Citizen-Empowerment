import { Component, OnInit } from '@angular/core';
import { FeedbackService } from '../../services/feedback.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-submit-feedback',
  templateUrl: './submit-feedback.component.html'
})
import { FeedbackService } from '../../services/feedback.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-submit-feedback',
  template: `
    <h2>Submit Feedback</h2>
    <div class="card mt-3">
      <div class="card-body">
        <form (ngSubmit)="submitFeedback()">
          <div class="mb-3">
            <label class="form-label">Title</label>
            <input type="text" class="form-control" [(ngModel)]="feedback.title" name="title" required>
          </div>
          
          <div class="mb-3">
            <label class="form-label">Category</label>
            <select class="form-select" [(ngModel)]="feedback.category" name="category">
              <option value="services">Public Services</option>
              <option value="policy">Policy Suggestions</option>
              <option value="infrastructure">Infrastructure</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div class="mb-3">
            <label class="form-label">Description</label>
            <textarea class="form-control" rows="5" [(ngModel)]="feedback.description" name="description" required></textarea>
          </div>
          
          <div *ngIf="message" class="alert" [ngClass]="{'alert-success': success, 'alert-danger': !success}">
            {{message}}
          </div>
          
          <button type="submit" class="btn btn-primary" [disabled]="submitting">Submit Feedback</button>
        </form>
      </div>
    </div>
  `
})
export class SubmitFeedbackComponent {
  feedback = {
    title: '',
    category: 'services',
    description: '',
    userEmail: ''
  };
  
  message = '';
  success = false;
  submitting = false;
  
  constructor(
    private feedbackService: FeedbackService,
    private authService: AuthService
  ) {
    this.feedback.userEmail = this.authService.getUserEmail() || '';
  }
  
  submitFeedback(): void {
    if (!this.feedback.title || !this.feedback.description) {
      this.message = 'Please fill in all required fields';
      this.success = false;
      return;
    }
    
    this.submitting = true;
    this.feedbackService.submitFeedback(this.feedback).subscribe({
      next: () => {
        this.message = 'Feedback submitted successfully!';
        this.success = true;
        this.feedback = {
          title: '',
          category: 'services',
          description: '',
          userEmail: this.authService.getUserEmail() || ''
        };
        this.submitting = false;
      },
      error: (err) => {
        this.message = err.error?.error || 'Failed to submit feedback';
        this.success = false;
        this.submitting = false;
      }
    });
  }
}