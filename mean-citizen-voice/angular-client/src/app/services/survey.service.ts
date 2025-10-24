import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SurveyService {
  private apiUrl = 'http://localhost:4001/api';
  
  constructor(private http: HttpClient) { }
  
  getSurveys(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/surveys`);
  }
  
  submitSurveyResponse(surveyId: string, response: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/surveys/${surveyId}/responses`, response);
  }
  
  getResponses(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/responses`);
  }
}