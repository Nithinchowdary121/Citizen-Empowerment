import { Component, OnInit } from '@angular/core';
import { FeedbackService } from '../../services/feedback.service';

@Component({
  selector: 'app-dashboard',
  template: `
    <h2>Dashboard</h2>
    <div class="row mt-4">
      <div class="col-md-4">
        <div class="card text-white bg-primary mb-3">
          <div class="card-header">Total Feedback</div>
          <div class="card-body">
            <h5 class="card-title">{{summary?.total || 0}}</h5>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card text-white bg-success mb-3">
          <div class="card-header">Surveys</div>
          <div class="card-body">
            <h5 class="card-title">{{summary?.surveysCount || 0}}</h5>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card text-white bg-info mb-3">
          <div class="card-header">Responses</div>
          <div class="card-body">
            <h5 class="card-title">{{summary?.responsesCount || 0}}</h5>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  summary: any = {};
  
  constructor(private feedbackService: FeedbackService) {}
  
  ngOnInit(): void {
    this.loadSummary();
  }
  
  loadSummary(): void {
    this.feedbackService.getReportSummary().subscribe({
      next: (data) => {
        this.summary = data;
      },
      error: (err) => {
        console.error('Failed to load summary', err);
      }
    });
  }
}