import { Component } from '@angular/core';
import { FeedbackService } from '../../services/feedback.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-submit-feedback',
  templateUrl: './submit-feedback.component.html'
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