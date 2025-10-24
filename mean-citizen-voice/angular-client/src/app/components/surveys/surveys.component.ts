import { Component, OnInit } from '@angular/core';
import { SurveyService } from '../../services/survey.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-surveys',
  template: `
    <h2>Surveys</h2>
    <div *ngIf="loading" class="text-center">
      <p>Loading surveys...</p>
    </div>
    <div *ngIf="!loading && surveys.length === 0" class="alert alert-info">
      No surveys available at the moment.
    </div>
    <div *ngIf="!loading && surveys.length > 0">
      <div *ngFor="let survey of surveys" class="card mb-4">
        <div class="card-header">
          <h5>{{survey.title}}</h5>
        </div>
        <div class="card-body">
          <form (ngSubmit)="submitResponse(survey)">
            <div *ngFor="let question of survey.questions; let i = index" class="mb-3">
              <label class="form-label">{{question.prompt}}</label>
              
              <div [ngSwitch]="question.type">
                <input *ngSwitchCase="'text'" type="text" class="form-control" 
                  [(ngModel)]="responses[survey._id][i]" [name]="'q'+i">
                
                <select *ngSwitchCase="'choice'" class="form-select" 
                  [(ngModel)]="responses[survey._id][i]" [name]="'q'+i">
                  <option value="">-- Select an option --</option>
                  <option *ngFor="let option of question.options" [value]="option">{{option}}</option>
                </select>
                
                <div *ngSwitchCase="'rating'" class="btn-group" role="group">
                  <button *ngFor="let n of [1,2,3,4,5]" type="button" class="btn"
                    [ngClass]="{'btn-primary': responses[survey._id][i] == n, 'btn-outline-primary': responses[survey._id][i] != n}"
                    (click)="responses[survey._id][i] = n">
                    {{n}}
                  </button>
                </div>
              </div>
            </div>
            
            <button type="submit" class="btn btn-primary">Submit Response</button>
            
            <div *ngIf="messages[survey._id]" class="alert mt-3"
              [ngClass]="{'alert-success': success[survey._id], 'alert-danger': !success[survey._id]}">
              {{messages[survey._id]}}
            </div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class SurveysComponent implements OnInit {
  surveys: any[] = [];
  loading = true;
  responses: {[key: string]: any[]} = {};
  messages: {[key: string]: string} = {};
  success: {[key: string]: boolean} = {};
  
  constructor(
    private surveyService: SurveyService,
    private authService: AuthService
  ) {}
  
  ngOnInit(): void {
    this.loadSurveys();
  }
  
  loadSurveys(): void {
    this.surveyService.getSurveys().subscribe({
      next: (data) => {
        this.surveys = data;
        this.loading = false;
        
        // Initialize responses for each survey
        this.surveys.forEach(survey => {
          this.responses[survey._id] = new Array(survey.questions.length);
        });
      },
      error: (err) => {
        console.error('Failed to load surveys', err);
        this.loading = false;
      }
    });
  }
  
  submitResponse(survey: any): void {
    const answers = this.responses[survey._id].map((answer, index) => ({
      questionIndex: index,
      answer
    })).filter(a => a.answer !== undefined && a.answer !== null && a.answer !== '');
    
    if (answers.length !== survey.questions.length) {
      this.messages[survey._id] = 'Please answer all questions';
      this.success[survey._id] = false;
      return;
    }
    
    const response = {
      answers,
      userEmail: this.authService.getUserEmail()
    };
    
    this.surveyService.submitSurveyResponse(survey._id, response).subscribe({
      next: () => {
        this.messages[survey._id] = 'Response submitted successfully!';
        this.success[survey._id] = true;
        this.responses[survey._id] = new Array(survey.questions.length);
      },
      error: (err) => {
        this.messages[survey._id] = err.error?.error || 'Failed to submit response';
        this.success[survey._id] = false;
      }
    });
  }
}