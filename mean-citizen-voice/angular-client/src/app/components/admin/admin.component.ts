import { Component, OnInit } from '@angular/core';
import { FeedbackService } from '../../services/feedback.service';

@Component({
  selector: 'app-admin',
  template: `
    <h2>Admin Dashboard</h2>
    
    <div class="row mt-4">
      <div class="col-md-12">
        <h4>Feedback Management</h4>
        <div class="table-responsive">
          <table class="table table-striped">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Status</th>
                <th>User</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of feedback">
                <td>{{item.title}}</td>
                <td>{{item.category}}</td>
                <td>
                  <select class="form-select form-select-sm" [(ngModel)]="item.status" (change)="updateStatus(item)">
                    <option value="submitted">Submitted</option>
                    <option value="in_review">In Review</option>
                    <option value="accepted">Accepted</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </td>
                <td>{{item.userEmail}}</td>
                <td>
                  <button class="btn btn-sm btn-danger" (click)="deleteFeedback(item._id)">Delete</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class AdminComponent implements OnInit {
  feedback: any[] = [];
  
  constructor(private feedbackService: FeedbackService) {}
  
  ngOnInit(): void {
    this.loadFeedback();
  }
  
  loadFeedback(): void {
    this.feedbackService.getFeedback().subscribe({
      next: (data) => {
        this.feedback = data;
      },
      error: (err) => {
        console.error('Failed to load feedback', err);
      }
    });
  }
  
  updateStatus(item: any): void {
    this.feedbackService.updateFeedbackStatus(item._id, item.status).subscribe({
      next: () => {
        console.log('Status updated successfully');
      },
      error: (err) => {
        console.error('Failed to update status', err);
      }
    });
  }
  
  deleteFeedback(id: string): void {
    if (confirm('Are you sure you want to delete this feedback?')) {
      this.feedbackService.deleteFeedback(id).subscribe({
        next: () => {
          this.feedback = this.feedback.filter(item => item._id !== id);
        },
        error: (err) => {
          console.error('Failed to delete feedback', err);
        }
      });
    }
  }
}